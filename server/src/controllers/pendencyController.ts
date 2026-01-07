import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const listPendencies = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const pendencies = await prisma.pendingItem.findMany({
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
            orderBy: { createdAt: 'desc' }
        });
        res.json(pendencies);
    } catch (error) {
        sendError500(res, ERROR_CODES.PEND_LIST, error);
    }
};

export const createPendency = async (req: Request, res: Response) => {
    try {
        const {
            description, responsible, priority, deadline,
            companyId, areaId, collaboratorId, visitId
        } = req.body;

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
                areaId,
                collaboratorId,
                visitId
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
        const { description, responsible, priority, deadline, areaId, collaboratorId, status, resolvedAt } = req.body;
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
