import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { loginSchema, registerSchema, registerCollaboratorSchema } from '../schemas/authSchemas';

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
            const company = await prisma.company.findUnique({ where: { id: companyId } });
            if (!company) {
                return res.status(400).json({ error: 'Invalid Company ID' });
            }
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
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

export const login = async (req: Request, res: Response) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { email, password } = validation.data;
        // console.log(`Login attempt for email: ${email}`); // Removed for security (PII)

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, companyId: user.companyId },
            JWT_SECRET,
            { expiresIn: '1d' }
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
    } catch (error: any) {
        console.error('=== LOGIN ERROR DETAILS ===');
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error code:', error?.code);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('Stack trace:', error?.stack);
        console.error('=== END LOGIN ERROR ===');
        res.status(500).json({
            error: 'Internal server error',
            // Include error details in development
            details: process.env.NODE_ENV !== 'production' ? error?.message : undefined
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
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(400).json({ error: 'Invalid Company' });

        // 2. Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
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
        const userId = (req as any).user.userId; // Middleware ensures user exists, but we'll fix type in routes
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
};
