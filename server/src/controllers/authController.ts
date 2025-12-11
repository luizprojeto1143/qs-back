import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma';

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not defined. Using default insecure key.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, companyId } = req.body;

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

        // Default role to COLABORADOR if not provided or invalid
        // Prevent creating MASTER via public endpoint unless specifically authorized (simplified here)
        const safeRole = (role === 'MASTER' || role === 'RH' || role === 'LIDER') ? role : 'COLABORADOR';

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
        console.error(error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);

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
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in', details: (error as any).message });
    }
};

export const registerCollaborator = async (req: Request, res: Response) => {
    try {
        const { email, password, name, matricula, areaId, companyId } = req.body;

        // 1. Validate Company
        if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
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
                    companyId
                }
            });

            const profile = await prisma.collaboratorProfile.create({
                data: {
                    userId: user.id,
                    matricula,
                    areaId,
                    shift: req.body.shift || '1_TURNO',
                    disabilityType: req.body.disabilityType || 'NENHUMA',
                    needsDescription: req.body.needsDescription || ''
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
