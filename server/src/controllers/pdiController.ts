import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const createPDI = async (req: Request, res: Response) => {
    try {
        const { userId, objective, skills, actions } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
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

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const pdis = await prisma.pDI.findMany({
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
            orderBy: { createdAt: 'desc' }
        });

        res.json(pdis);
    } catch (error) {
        console.error('Error listing PDIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePDI = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { objective, skills, actions, status } = req.body;

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
        await prisma.pDI.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting PDI:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
