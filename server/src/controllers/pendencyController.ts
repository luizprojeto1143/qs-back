import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';
import { createPendencySchema, updatePendencySchema } from '../schemas/dataSchemas';

export const listPendencies = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [pendencies, total] = await Promise.all([
            prisma.pendingItem.findMany({
                where: {
                    companyId: user.companyId
                },
                include: {
                    company: true,
                    area: true,
                    collaborator: {
                        include: {
                            user: true
                        }
                    },
                    visit: true
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.pendingItem.count({
                where: { companyId: user.companyId }
            })
        ]);

        res.json({
            data: pendencies,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        sendError500(res, ERROR_CODES.PEND_LIST, error);
    }
};

export const createPendency = async (req: Request, res: Response) => {
    try {
        // Validate input with Zod
        const validation = createPendencySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
        }

        const {
            description, responsible, priority, deadline,
            companyId, areaId, collaboratorId, visitId
        } = validation.data;

        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Security check
        if (user.role !== 'MASTER' && user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized to create pendency for this company' });
        }

        const pendency = await prisma.pendingItem.create({
            data: {
                description,
                responsible,
                priority,
                deadline: deadline ? new Date(deadline) : null,
                status: 'PENDENTE',
                companyId,
                areaId: areaId || null,  // Convert empty string to null
                collaboratorId: collaboratorId || null,  // Convert empty string to null
                visitId: visitId || null  // Convert empty string to null
            }
        });

        res.status(201).json(pendency);
    } catch (error) {
        sendError500(res, ERROR_CODES.PEND_CREATE, error);
    }
};

export const updatePendency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate input with Zod
        const validation = updatePendencySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
        }

        const { description, responsible, priority, deadline, areaId, collaboratorId, status, resolvedAt } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Verify ownership
        const existingPendency = await prisma.pendingItem.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existingPendency) {
            return res.status(404).json({ error: 'Pendency not found or access denied' });
        }

        const data: any = {};
        if (description !== undefined) data.description = description;
        if (responsible !== undefined) data.responsible = responsible;
        if (priority !== undefined) data.priority = priority;
        if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
        if (areaId !== undefined) data.areaId = areaId;
        if (collaboratorId !== undefined) data.collaboratorId = collaboratorId;
        if (status !== undefined) {
            data.status = status;
            data.resolvedAt = resolvedAt ? new Date(resolvedAt) : (status === 'RESOLVIDA' ? new Date() : null);
        }

        const pendency = await prisma.pendingItem.update({
            where: { id },
            data
        });

        res.json(pendency);
    } catch (error) {
        sendError500(res, ERROR_CODES.PEND_UPDATE, error);
    }
};

export const deletePendency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Verify ownership
        const existingPendency = await prisma.pendingItem.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existingPendency) {
            return res.status(404).json({ error: 'Pendency not found or access denied' });
        }

        await prisma.pendingItem.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.PEND_DELETE, error);
    }
};
