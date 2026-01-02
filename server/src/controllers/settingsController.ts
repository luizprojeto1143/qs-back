import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

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

export const checkTermsStatus = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const latestTerm = await prisma.termOfUse.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!latestTerm) {
            return res.json({ accepted: true }); // No terms to accept
        }

        const acceptance = await prisma.userTermsAcceptance.findUnique({
            where: {
                userId_termId: {
                    userId: user.userId,
                    termId: latestTerm.id
                }
            }
        });

        res.json({
            accepted: !!acceptance,
            latestTerm
        });
    } catch (error) {
        console.error('Error checking terms status:', error);
        res.status(500).json({ error: 'Error checking terms status' });
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

export const acceptTerms = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { termId, userAgent } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        // Check if already accepted
        const existing = await prisma.userTermsAcceptance.findUnique({
            where: {
                userId_termId: {
                    userId: user.userId,
                    termId
                }
            }
        });

        if (existing) {
            return res.json({ message: 'Terms already accepted' });
        }

        await prisma.userTermsAcceptance.create({
            data: {
                userId: user.userId,
                termId,
                companyId: user.companyId,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : 'unknown',
                userAgent: userAgent || 'unknown'
            }
        });

        res.json({ message: 'Terms accepted successfully' });
    } catch (error) {
        console.error('Error accepting terms:', error);
        res.status(500).json({ error: 'Error accepting terms' });
    }
};

export const getTermsAcceptanceReport = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Filter by company unless MASTER wants to see all (optional, let's stick to company scope for now)
        // If MASTER has no companyId (system admin), they might want to see all or filter by param.
        // For now, let's use the user's companyId context.

        const whereClause: any = {};
        if (user.companyId) {
            whereClause.companyId = user.companyId;
        }

        const report = await prisma.userTermsAcceptance.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                },
                term: {
                    select: { version: true }
                }
            },
            orderBy: { acceptedAt: 'desc' }
        });

        res.json(report);
    } catch (error) {
        console.error('Error fetching terms report:', error);
        res.status(500).json({ error: 'Error fetching report' });
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
        const { name, type, startTime, endTime, breakStart, breakEnd, workDays, restDays } = req.body;
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const shift = await prisma.shift.create({
            data: {
                name: name.toUpperCase(),
                type: type || '5X2',
                startTime,
                endTime,
                breakStart,
                breakEnd,
                workDays,
                restDays,
                companyId: user.companyId
            }
        });
        res.status(201).json(shift);
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Error creating shift' });
    }
};

export const updateShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, startTime, endTime, breakStart, breakEnd, workDays, restDays } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Verify ownership
        const existing = await prisma.shift.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        const shift = await prisma.shift.update({
            where: { id },
            data: {
                name: name ? name.toUpperCase() : undefined,
                type,
                startTime,
                endTime,
                breakStart,
                breakEnd,
                workDays,
                restDays
            }
        });
        res.json(shift);
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ error: 'Error updating shift' });
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
