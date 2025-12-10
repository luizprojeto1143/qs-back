import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const listSpecialists = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const specialists = await prisma.specialist.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: 'asc' }
        });

        res.json(specialists);
    } catch (error) {
        console.error('Error listing specialists:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createSpecialist = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const { name, email, type } = req.body;

        if (!name || !email || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const specialist = await prisma.specialist.create({
            data: {
                name,
                email,
                type,
                companyId: user.companyId
            }
        });

        res.status(201).json(specialist);
    } catch (error) {
        console.error('Error creating specialist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSpecialist = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, type } = req.body;

        const specialist = await prisma.specialist.update({
            where: { id },
            data: { name, email, type }
        });

        res.json(specialist);
    } catch (error) {
        console.error('Error updating specialist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteSpecialist = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.specialist.delete({
            where: { id }
        });

        res.json({ message: 'Specialist deleted successfully' });
    } catch (error) {
        console.error('Error deleting specialist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
