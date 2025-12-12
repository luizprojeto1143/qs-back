import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

import { createPDISchema, updatePDISchema } from '../schemas/dataSchemas';

export const createPDI = async (req: Request, res: Response) => {
    try {
        const validation = createPDISchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { userId, objective, skills, actions } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // IDOR CHECK: Users can only create PDIs for themselves, unless they are MASTER/RH
        if (userId !== user.userId && !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'You can only create PDIs for yourself.' });
        }

        const pdi = await prisma.pDI.create({
            data: {
                userId,
                companyId: user.companyId,
                objective,
                skills,
                actions,
                status: 'ACTIVE'
            }
        });

        res.status(201).json(pdi);
    } catch (error) {
        console.error('Error creating PDI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const listPDIs = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const [pdis, total] = await Promise.all([
            prisma.pDI.findMany({
                where: { companyId },
                include: {
                    user: {
                        select: {
                            name: true,
                            collaboratorProfile: {
                                include: {
                                    area: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.pDI.count({ where: { companyId } })
        ]);

        res.json({
            data: pdis,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing PDIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePDI = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = updatePDISchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { objective, skills, actions, status } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // IDOR CHECK: Ensure PDI belongs to user's company
        const existingPDI = await prisma.pDI.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existingPDI) {
            return res.status(404).json({ error: 'PDI not found or access denied' });
        }

        const pdi = await prisma.pDI.update({
            where: { id },
            data: {
                objective,
                skills,
                actions,
                status
            }
        });

        res.json(pdi);
    } catch (error) {
        console.error('Error updating PDI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deletePDI = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // IDOR CHECK
        const existingPDI = await prisma.pDI.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existingPDI) {
            return res.status(404).json({ error: 'PDI not found or access denied' });
        }

        await prisma.pDI.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting PDI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
