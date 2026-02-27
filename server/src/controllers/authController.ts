import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { loginSchema, registerSchema, registerCollaboratorSchema } from '../schemas/authSchemas';
import { AuthRequest, getIp, getUserAgent } from '../middleware/authMiddleware';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { logAction, ACTIONS } from '../services/auditService';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

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
        sendError500(res, ERROR_CODES.AUTH_CREATE_USER, error);
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
        const { email: rawEmail, password } = validation.data;
        const email = rawEmail.toLowerCase().trim();
        const { totpCode } = req.body;

        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
            await logAction(null, ACTIONS.LOGIN_FAIL, 'AUTH', { email, reason: 'User not found' }, null, getIp(req), getUserAgent(req));
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            await logAction(user.id, ACTIONS.LOGIN_FAIL, 'AUTH', { email, reason: 'Invalid password' }, user.companyId, getIp(req), getUserAgent(req));
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2FA Logic - Verify TOTP if enabled
        if (user.twoFactorEnabled) {
            if (!totpCode) {
                return res.status(400).json({ error: '2FA code required', requires2FA: true });
            }

            if (!user.twoFactorSecret) {
                return sendError500(res, ERROR_CODES.AUTH_SETUP_2FA, new Error('2FA secret missing'));
            }

            const isValidTotp = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: totpCode,
                window: 1 // Allow 1 step before/after for clock drift
            });

            if (!isValidTotp) {
                await logAction(user.id, ACTIONS.LOGIN_FAIL, 'AUTH', { email, reason: 'Invalid 2FA code' }, user.companyId, getIp(req), getUserAgent(req));
                return res.status(401).json({ error: 'Invalid 2FA code' });
            }
        }

        // Check for rememberMe option - extend session to 30 days
        const rememberMe = req.body.rememberMe === true;
        const jwtExpiration = rememberMe ? '30d' : (process.env.JWT_EXPIRATION || '7d');
        const token = jwt.sign(
            { userId: user.id, role: user.role, companyId: user.companyId },
            JWT_SECRET,
            { expiresIn: jwtExpiration as jwt.SignOptions['expiresIn'] }
        );

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
            console.warn('[Login] Audit log failed but login succeeded', logError);
        }
    } catch (error) {
        sendError500(res, ERROR_CODES.AUTH_LOGIN, error);
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
        const result = await prisma.$transaction(async (tx: any) => {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'COLABORADOR',
                    companyId,
                    avatar: validation.data.avatar // Save avatar URL
                }
            });

            const profile = await tx.collaboratorProfile.create({
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
        sendError500(res, ERROR_CODES.AUTH_REGISTER_COLLABORATOR, error);
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
    } catch (error) {
        sendError500(res, ERROR_CODES.AUTH_GET_PROFILE, error);
    }
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const secret = speakeasy.generateSecret({ length: 20, name: 'QS Inclusao' });

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
        sendError500(res, ERROR_CODES.AUTH_SETUP_2FA, error);
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
        sendError500(res, ERROR_CODES.AUTH_VERIFY_2FA, error);
    }
};

export const disable2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { password } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!password) return res.status(400).json({ error: 'Password is required to disable 2FA' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null }
        });

        res.json({ message: '2FA disabled successfully' });
        await logAction(userId, ACTIONS.disable2FA, 'USER', null, (req as AuthRequest).user?.companyId || null, getIp(req), getUserAgent(req));
    } catch (error) {
        sendError500(res, ERROR_CODES.AUTH_DISABLE_2FA, error);
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        if (userId) {
            await logAction(userId, ACTIONS.LOGOUT, 'AUTH', null, (req as AuthRequest).user?.companyId || null, getIp(req), getUserAgent(req));
        }
        // In a stateless JWT setup, logout is primarily client-side (token deletion)
        // If using Redis, we would blacklist the token here.
        res.json({ message: 'Logout successful' });
    } catch (error) {
        sendError500(res, ERROR_CODES.AUTH_LOGOUT, error);
    }
};
