import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// --- Perfomance Cycles ---

export const listCycles = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const cycles = await prisma.performanceCycle.findMany({
            where: { companyId: user.companyId },
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: { reviews: true }
                }
            }
        });

        res.json(cycles);
    } catch (error) {
        sendError500(res, 'PERFORMANCE_CYCLE_LIST_ERROR', error);
    }
};

export const createCycle = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId || !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const { name, startDate, endDate } = req.body;

        const cycle = await prisma.performanceCycle.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                companyId: user.companyId,
                status: 'DRAFT'
            }
        });

        res.status(201).json(cycle);
    } catch (error) {
        sendError500(res, 'PERFORMANCE_CYCLE_CREATE_ERROR', error);
    }
};

export const getCycleDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const cycle = await prisma.performanceCycle.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                reviews: {
                    include: {
                        reviewer: { select: { name: true, role: true, avatar: true } },
                        reviewee: { select: { name: true, role: true, avatar: true } }
                    }
                }
            }
        });

        if (!cycle) return res.status(404).json({ error: 'Cycle not found' });

        res.json(cycle);
    } catch (error) {
        sendError500(res, 'PERFORMANCE_CYCLE_DETAILS_ERROR', error);
    }
};

// --- Assignments ---

export const assignReviews = async (req: Request, res: Response) => {
    try {
        const { cycleId } = req.params;
        const { assignments } = req.body; // Array of { reviewerId, revieweeId, type }
        const user = (req as AuthRequest).user;

        if (!user || !['MASTER', 'RH'].includes(user.role)) return res.status(403).json({ error: 'Permission denied' });

        // Simple bulk create (or upsert logic if needed)
        // For simplicity, we assume the frontend sends valid pairs

        const createdReviews = await Promise.all(assignments.map(async (assignment: any) => {
            return prisma.performanceReview.upsert({
                where: {
                    cycleId_reviewerId_revieweeId: {
                        cycleId,
                        reviewerId: assignment.reviewerId,
                        revieweeId: assignment.revieweeId
                    }
                },
                update: {}, // Do nothing if exists
                create: {
                    cycleId,
                    reviewerId: assignment.reviewerId,
                    revieweeId: assignment.revieweeId,
                    type: assignment.type, // SELF, MANAGER, PEER
                    status: 'PENDING'
                }
            });
        }));

        res.json({ count: createdReviews.length });
    } catch (error) {
        sendError500(res, 'PERFORMANCE_ASSIGN_ERROR', error);
    }
};

export const updateCycle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate, status } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId || !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const cycle = await prisma.performanceCycle.update({
            where: { id, companyId: user.companyId },
            data: {
                name: name || undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                status: status || undefined
            }
        });

        res.json(cycle);
    } catch (error) {
        sendError500(res, 'PERFORMANCE_CYCLE_UPDATE_ERROR', error);
    }
};
