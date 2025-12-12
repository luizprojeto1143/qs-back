import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createUserSchema, updateUserSchema } from '../schemas/authSchemas';

export const listUsers = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Only MASTER can list all users. 
        // RH might list users from their company in the future, but for now let's stick to MASTER requirement.
        if (user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: {
                    active: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    active: true,
                    companyId: true,
                    areaId: true,
                    createdAt: true,
                    company: { select: { name: true } },
                    area: { select: { name: true } }
                },
                orderBy: { name: 'asc' },
                take: limit,
                skip
            }),
            prisma.user.count({ where: { active: true } })
        ]);

        res.json({
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: 'Error listing users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const validation = createUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { email, password, name, role, companyId, areaId } = validation.data;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                companyId,
                areaId
            }
        });

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const validation = updateUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { name, role, companyId, areaId, active, password } = validation.data;

        const data: any = {
            name,
            role,
            companyId,
            areaId,
            active
        };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Error updating user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Soft delete
        await prisma.user.update({
            where: { id },
            data: {
                active: false,
                deletedAt: new Date()
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
};
