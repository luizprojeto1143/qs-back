import { Request, Response } from 'express';
import prisma from '../prisma';

export const createVisit = async (req: Request, res: Response) => {
    try {
        const {
            companyId,
            areaId,
            collaboratorIds, // Array of User IDs
            relatos, // { lideranca, colaborador, observacoes }
            avaliacoes, // { area, lideranca, colaborador } (JSON strings or objects)
            pendencias, // Array of objects
            anexos // Array of objects
        } = req.body;

        const masterId = (req as any).user.userId;

        // Resolve User IDs to CollaboratorProfile IDs
        const profiles = await prisma.collaboratorProfile.findMany({
            where: { userId: { in: collaboratorIds } },
            select: { id: true, userId: true }
        });

        const profileIds = profiles.map(p => p.id);

        // Map User ID to Profile ID for notes
        const userToProfileMap = profiles.reduce((acc, curr) => {
            acc[curr.userId] = curr.id;
            return acc;
        }, {} as Record<string, string>);

        if (profileIds.length === 0 && collaboratorIds.length > 0) {
            console.warn('No profiles found for provided user IDs:', collaboratorIds);
        }

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
                    avaliacaoArea: JSON.stringify(avaliacoes?.area || {}),
                    avaliacaoLideranca: JSON.stringify(avaliacoes?.lideranca || {}),
                    avaliacaoColaborador: JSON.stringify(avaliacoes?.colaborador || {}),
                    collaborators: {
                        connect: profileIds.map((id: string) => ({ id }))
                    }
                }
            });

            // 2. Create Pendencies linked to the visit
            if (pendencias && pendencias.length > 0) {
                await Promise.all(pendencias.map(async (p: any) => {
                    // Resolve responsible/collaborator if needed
                    let collabProfileId = null;
                    if (p.collaboratorId) {
                        collabProfileId = userToProfileMap[p.collaboratorId] || null;
                    }

                    return prisma.pendingItem.create({
                        data: {
                            description: p.description,
                            responsible: p.responsible,
                            priority: p.priority,
                            deadline: p.deadline ? new Date(p.deadline) : null,
                            status: 'PENDENTE',
                            companyId,
                            areaId,
                            visitId: visit.id,
                            collaboratorId: collabProfileId
                        }
                    });
                }));
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

            // 4. Create Individual Notes
            if (req.body.individualNotes && req.body.individualNotes.length > 0) {
                await Promise.all(req.body.individualNotes.map((note: any) => {
                    const profileId = userToProfileMap[note.collaboratorId];
                    if (!profileId) {
                        console.warn(`Skipping note for user ${note.collaboratorId} - Profile not found`);
                        return Promise.resolve();
                    }

                    return prisma.visitNote.create({
                        data: {
                            visitId: visit.id,
                            collaboratorId: profileId,
                            content: note.content
                        }
                    });
                }));
            }

            return visit;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating visit:', error);
        // Enhanced error logging
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        res.status(500).json({ error: 'Error creating visit record', details: String(error) });
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
                attachments: true,
                notes: {
                    include: {
                        collaborator: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                }
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
