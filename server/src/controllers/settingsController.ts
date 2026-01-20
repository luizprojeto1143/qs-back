import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// Terms of Use
export const getTerms = async (req: Request, res: Response) => {
    try {
        const terms = await prisma.termOfUse.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(terms || { content: '' });
    } catch (error) {
        sendError500(res, ERROR_CODES.SET_TERMS_GET, error);
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

        const acceptance = await prisma.userTermsAcceptance.findFirst({
            where: {
                userId: user.userId,
                termId: latestTerm.id
            }
        });

        res.json({
            accepted: !!acceptance,
            latestTerm
        });
    } catch (error) {
        sendError500(res, ERROR_CODES.SET_TERMS_STATUS, error);
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
        sendError500(res, ERROR_CODES.SET_TERMS_UPDATE, error);
    }
};

export const acceptTerms = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { termId, userAgent } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        // Check if already accepted
        const existing = await prisma.userTermsAcceptance.findFirst({
            where: {
                userId: user.userId,
                termId
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
        sendError500(res, ERROR_CODES.SET_TERMS_ACCEPT, error);
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
        sendError500(res, ERROR_CODES.SET_TERMS_REPORT, error);
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
        res.json(categories || []);
    } catch (error) {
        // Log error but return empty array to prevent UI crash
        res.json([]);
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
        sendError500(res, ERROR_CODES.SET_CATEGORY_CREATE, error);
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
        sendError500(res, ERROR_CODES.SET_CATEGORY_DELETE, error);
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
        res.json(shifts || []);
    } catch (error) {
        // Return empty array instead of crashing UI
        res.json([]);
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
        sendError500(res, ERROR_CODES.SET_SHIFT_CREATE, error);
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
        sendError500(res, ERROR_CODES.SET_SHIFT_UPDATE, error);
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
        sendError500(res, ERROR_CODES.SET_SHIFT_DELETE, error);
    }
};

// Availability
export const getAvailability = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const company = await prisma.company.findFirst({
            where: { id: user.companyId },
            select: { availability: true }
        });

        let parsedAvailability = {};
        try {
            parsedAvailability = company?.availability ? JSON.parse(company.availability) : {};
        } catch (parseError) {
            console.error('[Settings] Failed to parse availability JSON:', parseError);
            // Default to empty object if parsing fails, don't crash the request
            parsedAvailability = {};
        }

        res.json(parsedAvailability);
    } catch (error) {
        // Return empty object instead of 500 to allow UI to render default form
        res.json({});
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
        sendError500(res, ERROR_CODES.SET_AVAILABILITY, error);
    }
};
