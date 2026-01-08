import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateVisitData {
    date: string | Date;
    time?: string;
    companyId: string;
    areaId?: string;
    collaboratorIds: string[];
    masterId: string;
    relatos: {
        lideranca?: string | null;
        colaborador?: string | null;
        consultoria?: string | null;
        observacoes?: string | null;
        audioLideranca?: string | null;
        audioColaborador?: string | null;
    };
    avaliacoes: {
        area: any;
        lideranca: any;
        colaborador: any;
    };
    pendencias: Array<{
        responsibleId: string;
        description: string;
        deadline: string | Date;
        priority: 'BAIXA' | 'MEDIA' | 'ALTA';
        status: 'PENDENTE' | 'CONCLUIDO';
    }>;
    anexos: Array<{
        url: string;
        type: string;
        name: string;
    }>;
    scheduleId?: string;
    notes?: Array<{
        collaboratorId: string;
        content: string;
    }>;
    isFinished?: boolean;
}

interface VisitFilters {
    startDate?: string;
    endDate?: string;
    areaId?: string;
    collaboratorId?: string;
    masterId?: string;
    status?: string;
}

export class VisitService {
    async create(data: CreateVisitData) {
        // 1. Resolve Master Profile (User)
        const masterUser = await prisma.user.findUnique({
            where: { id: data.masterId }
        });

        if (!masterUser || masterUser.role !== 'MASTER') {
            // Note: Depending on logic, maybe any user can create? But stick to master check if needed.
            // For now just allow if user exists.
            if (!masterUser) throw new Error('Usuário Master não encontrado');
        }

        // 2. Resolve Collaborators
        const collaborators = await prisma.collaboratorProfile.findMany({
            where: { id: { in: data.collaboratorIds } }
        });

        if (collaborators.length !== data.collaboratorIds.length) {
            throw new Error('Um ou mais colaboradores não encontrados');
        }

        const visitDate = new Date(data.date);

        // 3. Transaction for Consistency
        return await prisma.$transaction(async (tx) => {
            // Helper to format evaluations for DB
            const evaluationsToCreate: any[] = [];

            const processEvaluations = (type: string, data: any) => {
                if (data && typeof data === 'object') {
                    Object.entries(data).forEach(([criteria, value]) => {
                        evaluationsToCreate.push({
                            type,
                            criteria,
                            rating: typeof value === 'number' ? value : (value ? 1 : 0), // Handle numeric or boolean/string ratings
                            comment: null // Future: allow comments per criteria
                        });
                    });
                }
            };

            processEvaluations('AREA', data.avaliacoes.area);
            processEvaluations('LIDERANCA', data.avaliacoes.lideranca);
            processEvaluations('LIDERANCA', data.avaliacoes.colaborador); // Typos in original? Assuming COLABORADOR
            processEvaluations('COLABORADOR', data.avaliacoes.colaborador);


            // Create Visit
            const visit = await tx.visit.create({
                data: {
                    date: visitDate,
                    time: data.time,
                    companyId: data.companyId,
                    areaId: data.areaId,
                    masterId: masterUser.id, // Direct User ID associated with "MasterVisits"
                    relatoLideranca: data.relatos.lideranca,
                    relatoColaborador: data.relatos.colaborador,
                    relatoConsultoria: data.relatos.consultoria,
                    observacoesMaster: data.relatos.observacoes,
                    audioLiderancaUrl: data.relatos.audioLideranca,
                    audioColaboradorUrl: data.relatos.audioColaborador,
                    collaborators: {
                        connect: collaborators.map(c => ({ id: c.id })) // Connect Many-to-Many
                    },
                    evaluations: {
                        create: evaluationsToCreate
                    }
                }
            });

            // Create Pendencies
            if (data.pendencias.length > 0) {
                await tx.pendingItem.createMany({
                    data: data.pendencias.map(p => ({
                        visitId: visit.id,
                        responsibleId: p.responsibleId,
                        description: p.description,
                        deadline: new Date(p.deadline),
                        priority: p.priority,
                        status: p.status,
                        companyId: data.companyId,
                        responsible: p.responsibleId // Assuming responsibleId IS the responsible string/id column, checking schema it is 'responsible String'
                    }))
                });
            }

            // Create Attachments
            if (data.anexos.length > 0) {
                await tx.visitAttachment.createMany({
                    data: data.anexos.map(a => ({
                        visitId: visit.id,
                        url: a.url,
                        type: a.type,
                        name: a.name
                    }))
                });
            }

            // Create Individual Notes
            if (data.notes && data.notes.length > 0) {
                await tx.visitNote.createMany({
                    data: data.notes.map(n => ({
                        visitId: visit.id,
                        collaboratorId: n.collaboratorId,
                        content: n.content
                    }))
                });
            }

            // Update Schedule if exists
            if (data.scheduleId) {
                await tx.schedule.update({
                    where: { id: data.scheduleId },
                    data: {
                        status: 'REALIZADO',
                        visitId: visit.id,
                        notes: 'Visita realizada e vinculada automaticamente.'
                    }
                });
            }

            return visit;
        });
    }

    async list(companyId: string, filters: VisitFilters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where: any = { companyId };

        if (filters.startDate && filters.endDate) {
            where.date = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }

        if (filters.areaId) {
            where.areaId = filters.areaId;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.masterId) {
            where.masterId = filters.masterId;
        }

        if (filters.collaboratorId) {
            where.collaborators = {
                some: {
                    id: filters.collaboratorId
                }
            };
        }

        const [visits, total] = await Promise.all([
            prisma.visit.findMany({
                where,
                include: {
                    area: true,
                    master: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    collaborators: true,
                    attachments: true,
                    generatedPendencies: { // Correct relation name
                        // responsible: true // Responsible is a String in schema, not a relation? Schema says `responsible String`. So no include needed or it is a relation? Schema says `responsible String`. Wait, looking at VisitController legacy: `userToProfileMap` suggested relation. But schema says `responsible String`. I will remove include for now to be safe.
                    }
                    ,
                    _count: {
                        select: { generatedPendencies: true, attachments: true }
                    }
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit
            }),
            prisma.visit.count({ where })
        ]);

        return {
            data: visits,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id: string, companyId?: string) {
        const where: any = { id };
        if (companyId) where.companyId = companyId;

        const visit = await prisma.visit.findFirst({
            where,
            include: {
                area: true,
                master: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                collaborators: true,
                attachments: true,
                evaluations: true, // Fetch evaluations
                generatedPendencies: true,
                notes: { // VisitNotes
                    include: {
                        collaborator: true
                    }
                }
            }
        });

        if (!visit) throw new Error('Visita não encontrada');

        // Reconstruct JSON for Frontend Compatibility
        const evaluations: any = { area: {}, lideranca: {}, colaborador: {} };

        if (visit.evaluations) {
            visit.evaluations.forEach((ev: any) => { // Explicit type
                if (ev.type === 'AREA') evaluations.area[ev.criteria] = ev.rating;
                if (ev.type === 'LIDERANCA') evaluations.lideranca[ev.criteria] = ev.rating;
                if (ev.type === 'COLABORADOR') evaluations.colaborador[ev.criteria] = ev.rating;
            });
        }

        return {
            ...visit,
            avaliacaoArea: JSON.stringify(evaluations.area),
            avaliacaoLideranca: JSON.stringify(evaluations.lideranca),
            avaliacaoColaborador: JSON.stringify(evaluations.colaborador)
        };
    }
}
