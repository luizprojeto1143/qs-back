import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// Terms of Use
export const getTerms = async (req: Request, res: Response) => {
    try {
        const terms = await prisma.termOfUse.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(terms || { content: '' });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching terms' });
    }
};

export const updateTerms = async (req: Request, res: Response) => {
    try {
        const { content, version } = req.body;
        const terms = await prisma.termOfUse.create({
            data: { content, version, active: true }
        });
        res.json(terms);
    } catch (error) {
        res.status(500).json({ error: 'Error updating terms' });
    }
};

// Feed Categories
export const getFeedCategories = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const categories = await prisma.feedCategory.findMany({
            where: { companyId: user.companyId, active: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching feed categories:', error);
        res.status(500).json({ error: 'Error fetching categories' });
    }
};

export const createFeedCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const category = await prisma.feedCategory.create({
            data: {
                name: name.toUpperCase(),
                companyId: user.companyId
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating feed category:', error);
        res.status(500).json({ error: 'Error creating category' });
    }
};

export const deleteFeedCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Soft delete or hard delete? Let's do hard delete for now as requested "remove"
        // But check if it belongs to company
        const category = await prisma.feedCategory.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await prisma.feedCategory.delete({ where: { id } });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting feed category:', error);
    }
};

// Shifts
export const getShifts = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const shifts = await prisma.shift.findMany({
            where: { companyId: user.companyId, active: true },
            orderBy: { name: 'asc' }
        });
        res.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Error fetching shifts' });
    }
};

export const createShift = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const shift = await prisma.shift.create({
            data: {
                name: name.toUpperCase(),
                companyId: user.companyId
            }
        });
        res.status(201).json(shift);
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Error creating shift' });
    }
};

export const deleteShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const shift = await prisma.shift.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        await prisma.shift.delete({ where: { id } });
        res.json({ message: 'Shift deleted' });
    } catch (error) {
        console.error('Error deleting shift:', error);
    }
};

// Availability
export const getAvailability = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { availability: true }
        });

        res.json(company?.availability ? JSON.parse(company.availability) : {});
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Error fetching availability' });
    }
};

export const updateAvailability = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const availability = req.body;

        await prisma.company.update({
            where: { id: user.companyId },
            data: { availability: JSON.stringify(availability) }
        });

        res.json({ message: 'Availability updated' });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Error updating availability' });
    }
};
