import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma';

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
