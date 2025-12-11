import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const createVisit = async (req: Request, res: Response) => {
    try {
        const {
            companyId,
            areaId,
            collaboratorIds, // Array of User IDs
            relatos, // { lideranca, colaborador, observacoes }
            avaliacoes, // { area, lideranca, colaborador } (JSON strings or objects)
            pendencias, // Array of objects
            anexos, // Array of objects
            individualNotes // Array of objects
        } = req.body;

        const masterId = (req as AuthRequest).user?.userId;

        if (!masterId) return res.status(401).json({ error: 'Unauthorized' });

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
                    avaliacaoArea: typeof avaliacoes?.area === 'string' ? avaliacoes.area : JSON.stringify(avaliacoes?.area || {}),
                    avaliacaoLideranca: typeof avaliacoes?.lideranca === 'string' ? avaliacoes.lideranca : JSON.stringify(avaliacoes?.lideranca || {}),
                    avaliacaoColaborador: typeof avaliacoes?.colaborador === 'string' ? avaliacoes.colaborador : JSON.stringify(avaliacoes?.colaborador || {}),
                    collaborators: {
                        connect: profileIds.map((id: string) => ({ id }))
                    }
                }
            });

            // 2. Create Pendencies linked to the visit
            if (pendencias && pendencias.length > 0) {
                // Prepare data for createMany
                const pendencyData = pendencias.map((p: any) => ({
                    description: p.description,
                    responsible: p.responsible,
                    priority: p.priority,
                    deadline: p.deadline ? new Date(p.deadline) : null,
                    status: 'PENDENTE',
                    companyId,
                    areaId,
                    visitId: visit.id,
                    collaboratorId: p.collaboratorId ? (userToProfileMap[p.collaboratorId] || null) : null
                }));

                await prisma.pendingItem.createMany({
                    data: pendencyData
                });
            }

            // 3. Create Attachments
            if (anexos && anexos.length > 0) {
                const attachmentData = anexos.map((a: any) => ({
                    visitId: visit.id,
                    type: a.type,
                    url: a.url,
                    name: a.name
                }));

                await prisma.visitAttachment.createMany({
                    data: attachmentData
                });
            }

            // 4. Create Individual Notes
            if (individualNotes && individualNotes.length > 0) {
                const notesData = individualNotes
                    .filter((note: any) => userToProfileMap[note.collaboratorId]) // Ensure profile exists
                    .map((note: any) => ({
                        visitId: visit.id,
                        collaboratorId: userToProfileMap[note.collaboratorId],
                        content: note.content
                    }));

                if (notesData.length > 0) {
                    await prisma.visitNote.createMany({
                        data: notesData
                    });
                }
            }

            return visit;
        });

        res.status(201).json(result);
    } catch (error) {
        // console.error('Error creating visit:', error);
        res.status(500).json({ error: 'Error creating visit record' });
    }
};

export const listVisits = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

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
            orderBy: { date: 'desc' },
            take: 50 // Limit to 50 for now (Pagination TODO)
        });
        res.json(visits);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching visits' });
    }
};

export const getVisit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

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

        res.json(visit);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching visit' });
    }
};
