import { Request, Response } from 'express';
import prisma from '../prisma';

export const createVisit = async (req: Request, res: Response) => {
    try {
        const {
            companyId,
            areaId,
            collaboratorIds, // Array of strings
            relatos, // { lideranca, colaborador, observacoes }
            avaliacoes, // { area, lideranca, colaborador } (JSON strings or objects)
            pendencias, // Array of objects
            anexos // Array of objects
        } = req.body;

        const masterId = (req as any).user.userId;

        // Transaction to ensure data consistency
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Create the Visit record
            const visit = await prisma.visit.create({
                data: {
                    companyId,
                    areaId,
                    masterId,
                    relatoLideranca: relatos.lideranca,
                    relatoColaborador: relatos.colaborador,
                    observacoesMaster: relatos.observacoes,
                    avaliacaoArea: JSON.stringify(avaliacoes.area),
                    avaliacaoLideranca: JSON.stringify(avaliacoes.lideranca),
                    avaliacaoColaborador: JSON.stringify(avaliacoes.colaborador),
                    collaborators: {
                        connect: collaboratorIds.map((id: string) => ({ id }))
                    }
                }
            });

            // 2. Create Pendencies linked to the visit
            if (pendencias && pendencias.length > 0) {
                await Promise.all(pendencias.map((p: any) =>
                    prisma.pendingItem.create({
                        data: {
                            description: p.description,
                            responsible: p.responsible,
                            priority: p.priority,
                            deadline: p.deadline ? new Date(p.deadline) : null,
                            status: 'PENDENTE',
                            companyId,
                            areaId,
                            visitId: visit.id,
                            collaboratorId: p.collaboratorId || null
                        }
                    })
                ));
            }

            // 3. Create Attachments
            if (anexos && anexos.length > 0) {
                await Promise.all(anexos.map((a: any) =>
                    prisma.visitAttachment.create({
                        data: {
                            visitId: visit.id,
                            type: a.type,
                            url: a.url,
                            name: a.name
                        }
                    })
                ));
            }

            return visit;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating visit:', error);
        res.status(500).json({ error: 'Error creating visit record' });
    }
};

export const listVisits = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const companyId = req.headers['x-company-id'] as string || user.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const visits = await prisma.visit.findMany({
            where: { companyId },
            include: {
                company: true,
                area: true,
                master: { select: { name: true } },
                collaborators: { include: { user: { select: { name: true } } } },
                generatedPendencies: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(visits);
    } catch (error) {
        console.error('Error fetching visits:', error);
        res.status(500).json({ error: 'Error fetching visits' });
    }
};

export const getVisit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const companyId = req.headers['x-company-id'] as string || user.companyId;

        const visit = await prisma.visit.findUnique({
            where: { id },
            include: {
                company: true,
                area: true,
                master: { select: { name: true } },
                collaborators: { include: { user: { select: { name: true } } } },
                generatedPendencies: true,
                attachments: true
            }
        });

        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        // Security check
        if (visit.companyId !== companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        res.json(visit);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching visit' });
    }
};
