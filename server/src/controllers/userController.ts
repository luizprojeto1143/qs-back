import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const listUsers = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Only MASTER can list all users. 
        // RH might list users from their company in the future, but for now let's stick to MASTER requirement.
        if (user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const users = await prisma.user.findMany({
            where: {
                role: { in: ['RH', 'LIDER', 'MASTER'] } // Don't list collaborators here, they have their own list
            },
            include: {
                company: { select: { name: true } },
                area: { select: { name: true } }
            },
            orderBy: { name: 'asc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: 'Error listing users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, companyId, areaId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Validations
        if (!['RH', 'LIDER', 'MASTER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        if (role !== 'MASTER' && !companyId) {
            return res.status(400).json({ error: 'Company is required for this role' });
        }

        if (role === 'LIDER' && !areaId) {
            return res.status(400).json({ error: 'Area is required for LIDER role' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                companyId: role === 'MASTER' ? null : companyId,
                areaId: role === 'LIDER' ? areaId : null
            }
        });

        res.status(201).json(newUser);
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Error creating user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, companyId, areaId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData: any = { name, email, role };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (role !== 'MASTER') {
            updateData.companyId = companyId;
            if (role === 'LIDER') {
                updateData.areaId = areaId;
            } else {
                updateData.areaId = null;
            }
        } else {
            updateData.companyId = null;
            updateData.areaId = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json(updatedUser);
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

        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
};
