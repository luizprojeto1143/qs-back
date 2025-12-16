import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

import { createVisitSchema, updateVisitSchema } from '../schemas/dataSchemas';
import { PAGINATION } from '../config/constants';

export const createVisit = async (req: Request, res: Response) => {
    try {
        const validation = createVisitSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        const {
            companyId,
            areaId,
            collaboratorIds,
            relatos,
            avaliacoes,
            pendencias,
            anexos,
            individualNotes
        } = validation.data;

        const masterId = (req as AuthRequest).user?.userId;

        if (!masterId) return res.status(401).json({ error: 'Unauthorized' });

        // Resolve User IDs to CollaboratorProfile IDs
        const profiles = await prisma.collaboratorProfile.findMany({
            where: { userId: { in: collaboratorIds } },
            select: { id: true, userId: true }
        });

        const profileIds = profiles.map(p => p.id);

        if (profileIds.length !== collaboratorIds.length) {
            return res.status(400).json({ error: 'One or more collaborators not found or invalid.' });
        }

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



        const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where = { companyId };

        const [visits, total] = await Promise.all([
            prisma.visit.findMany({
                where,
                include: {
                    company: { select: { name: true } },
                    area: { select: { name: true } },
                    master: { select: { name: true } },
                    collaborators: {
                        include: {
                            user: { select: { name: true } }
                        }
                    }
                },
                orderBy: { date: 'desc' },
                take: limit,
                skip
            }),
            prisma.visit.count({ where })
        ]);

        res.json({
            data: visits,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
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

export const updateVisit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = updateVisitSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        const {
            companyId,
            areaId,
            collaboratorIds,
            relatos,
            avaliacoes,
            pendencias,
            anexos,
            individualNotes
        } = validation.data;

        const user = (req as AuthRequest).user;
        const requestCompanyId = req.headers['x-company-id'] as string || user?.companyId;

        // Check if visit exists
        const existingVisit = await prisma.visit.findUnique({
            where: { id },
            include: { generatedPendencies: true } // Need to know existing pendencies
        });

        if (!existingVisit) return res.status(404).json({ error: 'Visit not found' });
        if (existingVisit.companyId !== requestCompanyId) return res.status(403).json({ error: 'Access denied' });

        // Resolve User IDs to CollaboratorProfile IDs
        const profiles = await prisma.collaboratorProfile.findMany({
            where: { userId: { in: collaboratorIds } },
            select: { id: true, userId: true }
        });

        const profileIds = profiles.map(p => p.id);
        const userToProfileMap = profiles.reduce((acc, curr) => {
            acc[curr.userId] = curr.id;
            return acc;
        }, {} as Record<string, string>);

        const result = await prisma.$transaction(async (prisma) => {
            // 1. Update Visit Base Data
            const visit = await prisma.visit.update({
                where: { id },
                data: {
                    companyId,
                    areaId,
                    relatoLideranca: relatos.lideranca,
                    relatoColaborador: relatos.colaborador,
                    observacoesMaster: relatos.observacoes,
                    avaliacaoArea: typeof avaliacoes?.area === 'string' ? avaliacoes.area : JSON.stringify(avaliacoes?.area || {}),
                    avaliacaoLideranca: typeof avaliacoes?.lideranca === 'string' ? avaliacoes.lideranca : JSON.stringify(avaliacoes?.lideranca || {}),
                    avaliacaoColaborador: typeof avaliacoes?.colaborador === 'string' ? avaliacoes.colaborador : JSON.stringify(avaliacoes?.colaborador || {}),
                    collaborators: {
                        set: profileIds.map(id => ({ id })) // Replace all collaborators
                    }
                }
            });

            // 2. Handle Pendencies (Diff Logic)
            if (pendencias) {
                const existingIds = existingVisit.generatedPendencies.map(p => p.id);
                const incomingIds = pendencias.filter(p => p.id && existingIds.includes(p.id)).map(p => p.id as string);

                // IDs to delete (in DB but not in payload)
                const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

                // Delete removed pendencies
                if (idsToDelete.length > 0) {
                    await prisma.pendingItem.deleteMany({
                        where: { id: { in: idsToDelete } }
                    });
                }

                // Update or Create
                for (const p of pendencias) {
                    if (p.id && existingIds.includes(p.id)) {
                        // Update
                        await prisma.pendingItem.update({
                            where: { id: p.id },
                            data: {
                                description: p.description,
                                responsible: p.responsible,
                                priority: p.priority,
                                deadline: p.deadline ? new Date(p.deadline) : null,
                                status: p.status as any || undefined
                            }
                        });
                    } else {
                        // Create New
                        await prisma.pendingItem.create({
                            data: {
                                description: p.description,
                                responsible: p.responsible,
                                priority: p.priority,
                                deadline: p.deadline ? new Date(p.deadline) : null,
                                status: 'PENDENTE',
                                companyId,
                                areaId,
                                visitId: visit.id,
                                collaboratorId: p.collaboratorId ? (userToProfileMap[p.collaboratorId] || null) : null
                            }
                        });
                    }
                }
            }

            // 3. Attachments (Simple Replace)
            if (anexos) {
                await prisma.visitAttachment.deleteMany({ where: { visitId: id } });
                if (anexos.length > 0) {
                    await prisma.visitAttachment.createMany({
                        data: anexos.map(a => ({
                            visitId: id,
                            type: a.type,
                            url: a.url,
                            name: a.name
                        }))
                    });
                }
            }

            // 4. Individual Notes (Simple Replace)
            if (individualNotes) {
                await prisma.visitNote.deleteMany({ where: { visitId: id } });
                if (individualNotes.length > 0) {
                    const notesData = individualNotes
                        .filter((note: any) => userToProfileMap[note.collaboratorId])
                        .map((note: any) => ({
                            visitId: id,
                            collaboratorId: userToProfileMap[note.collaboratorId],
                            content: note.content
                        }));

                    if (notesData.length > 0) {
                        await prisma.visitNote.createMany({ data: notesData });
                    }
                }
            }

            return visit;
        });

        res.json(result);
    } catch (error) {
        // console.error('Error updating visit:', error);
        res.status(500).json({ error: 'Error updating visit record' });
    }
};
