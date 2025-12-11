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
                role: { in: ['RH', 'LIDER', 'MASTER'] }, // Don't list collaborators here, they have their own list
                active: true
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

// ... createUser and updateUser remain the same ...

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
