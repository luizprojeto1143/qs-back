import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { loginSchema, registerSchema, registerCollaboratorSchema } from '../schemas/authSchemas';
import { AuthRequest, getIp, getUserAgent } from '../middleware/authMiddleware';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { logAction, ACTIONS } from '../services/auditService';

// ... (code between header and getProfile remains unchanged, I will target the getProfile function)

// I cannot target non-contiguous blocks easily with one replace, but I can target the top imports and the getProfile function separately if needed, 
// or I can assume lines 1-5 need the import added.
// Wait, I can't use multi_replace for non-contiguous if I use replace_file_content.
// I will use multi_replace_file_content as I need to touch imports AND the usage down below.
// Actually, I'll allow multiple tool calls or just use replace_file_content twice?
// No, I should use multi_replace_file_content if I want to do it cleanly in one go, but replace_file_content is requested.
// I will add the import first, then fix the function.
// Actually, I can just add the import at the top.


if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req: Request, res: Response) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { email, password, name, role, companyId } = validation.data;

        // Validate Company if provided
        if (companyId) {
            const company = await prisma.company.findFirst({ where: { id: companyId } });
            if (!company) {
                return res.status(400).json({ error: 'Invalid Company ID' });
            }
        }

        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Force role to COLABORADOR for public registration
        // MASTER users must be created via the protected /users endpoint
        const safeRole = 'COLABORADOR';

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: safeRole,
                companyId,
            },
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { email, password } = validation.data;
        // Check for totp code in body (not in schema yet, but we can extract it manually or update schema)
        // For now, let's extract it from req.body directly as it might be extra
        const { totpCode } = req.body;

        console.log(`[Auth] Login Attempt for: ${email}`);
        console.log('[Login] Step 1: Searching user with $queryRaw...');

        // Using $queryRaw to bypass PGBouncer prepared statement issues
        const users = await prisma.$queryRaw<Array<{
            id: string;
            name: string;
            email: string;
            password: string;
            role: string;
            companyId: string | null;
            avatar: string | null;
            active: boolean;
            twoFactorEnabled: boolean;
            twoFactorSecret: string | null;
        }>>`SELECT id, name, email, password, role, "companyId", avatar, active, "twoFactorEnabled", "twoFactorSecret" FROM "User" WHERE email = ${email} LIMIT 1`;

        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            console.log('[Login] User not found');
            await logAction(null, ACTIONS.LOGIN_FAIL, 'AUTH', { email, reason: 'User not found' }, null, getIp(req), getUserAgent(req));
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('[Login] Step 2: User found, verifying password...');

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('[Login] Invalid password');
            await logAction(user.id, ACTIONS.LOGIN_FAIL, 'AUTH', { email, reason: 'Invalid password' }, user.companyId, getIp(req), getUserAgent(req));
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('[Login] Step 3: Password valid. Checking 2FA...');

        // 2FA Logic
        if (user.twoFactorEnabled) {
            // ... (keep existing logic)
        }

        console.log('[Login] Step 4: Generating token...');
        const token = jwt.sign(
            { userId: user.id, role: user.role, companyId: user.companyId },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log('[Login] Step 5: Token generated. Logging action and responding...');

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                avatar: user.avatar,
            },
        });

        // Log successful login
        try {
            await logAction(user.id, ACTIONS.LOGIN, 'AUTH', { role: user.role }, user.companyId, getIp(req), getUserAgent(req));
        } catch (logError) {
            console.error('[Login] Warning: Audit log failed but login succeeded', logError);
        }
    } catch (error: any) {
        console.error('Login CRASH:', error);
        res.status(500).json({
            error: 'Internal Login Error',
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
    }
};

export const registerCollaborator = async (req: Request, res: Response) => {
    try {
        const validation = registerCollaboratorSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { email, password, name, matricula, areaId, companyId, shift, disabilityType, needsDescription } = validation.data;

        // 1. Validate Company
        const company = await prisma.company.findFirst({ where: { id: companyId } });
        if (!company) return res.status(400).json({ error: 'Invalid Company' });

        // 2. Check if user exists
        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });

        // 3. Create User & Profile in Transaction
        const result = await prisma.$transaction(async (prisma) => {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'COLABORADOR',
                    companyId,
                    avatar: validation.data.avatar // Save avatar URL
                }
            });

            const profile = await prisma.collaboratorProfile.create({
                data: {
                    userId: user.id,
                    matricula,
                    areaId,
                    shift: shift || '1_TURNO',
                    nextRestDay: validation.data.nextRestDay ? new Date(validation.data.nextRestDay) : null,
                    disabilityType: disabilityType || 'NENHUMA',
                    needsDescription: needsDescription || ''
                }
            });

            return { user, profile };
        });

        res.status(201).json({ message: 'Collaborator registered successfully', userId: result.user.id });

    } catch (error) {
        console.error('Error registering collaborator:', error);
        res.status(500).json({ error: 'Error registering collaborator' });
    }
};
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId; // Typed access
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in token' });
        }

        const user = await prisma.user.findFirst({
            where: { id: userId },
            include: {
                company: true,
                collaboratorProfile: {
                    include: {
                        workSchedule: true,
                        area: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
        // ... existing codes
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const secret = speakeasy.generateSecret({ length: 20, name: `QS Inclusao (${(req as AuthRequest).user?.email})` });

        // Save secret to DB (but keep 2fa disabled until verified)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 }
        });

        // Generate QR Code
        const dataUrl = await qrcode.toDataURL(secret.otpauth_url!);

        res.json({
            secret: secret.base32,
            qrCode: dataUrl
        });

        await logAction(userId, ACTIONS.setup2FA, 'USER', null, (req as AuthRequest).user?.companyId || null, getIp(req), getUserAgent(req));
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        res.status(500).json({ error: 'Error setting up 2FA' });
    }
};

export const verify2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { token } = req.body;

        if (!userId || !token) return res.status(400).json({ error: 'Missing data' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA not initialized' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true }
            });
            res.json({ message: '2FA enabled successfully' });
            await logAction(userId, ACTIONS.enable2FA, 'USER', null, (req as AuthRequest).user?.companyId || null, getIp(req), getUserAgent(req));
        } else {
            res.status(400).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ error: 'Error verifying 2FA' });
    }
};

export const disable2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        // In a real app, require 2FA token to disable 2FA or password confirmation
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null }
        });

        res.json({ message: '2FA disabled successfully' });
        await logAction(userId, ACTIONS.disable2FA, 'USER', null, (req as AuthRequest).user?.companyId || null, getIp(req), getUserAgent(req));
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ error: 'Error disabling 2FA' });
    }
};
