import { Request, Response } from 'express';
import prisma from '../prisma';

export const listPendencies = async (req: Request, res: Response) => {
    try {
        const pendencies = await prisma.pendingItem.findMany({
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
        res.status(500).json({ error: 'Error fetching pendencies' });
    }
};

export const createPendency = async (req: Request, res: Response) => {
    try {
        const {
            description, responsible, priority, deadline,
            companyId, areaId, collaboratorId, visitId
        } = req.body;

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
        console.error(error);
        res.status(500).json({ error: 'Error creating pendency' });
    }
};

export const updatePendency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, resolvedAt } = req.body;

        const pendency = await prisma.pendingItem.update({
            where: { id },
            data: {
                status,
                resolvedAt: resolvedAt ? new Date(resolvedAt) : (status === 'RESOLVIDA' ? new Date() : null)
            }
        });

        res.json(pendency);
    } catch (error) {
        res.status(500).json({ error: 'Error updating pendency' });
    }
};
