import prisma from '../prisma'; // Use global configured instance

interface EvaluationCriteria {
    [key: string]: number;
}

interface CreateVisitData {
    date?: string | Date; // Now optional - will default to current date
    time?: string;
    companyId: string;
    areaId?: string | null;
    collaboratorIds?: string[]; // Now optional with default []
    masterId?: string; // Now optional - will be extracted from auth
    relatos?: {
        lideranca?: string | null;
        colaborador?: string | null;
        consultoria?: string | null;
        observacoes?: string | null;
        audioLideranca?: string | null;
        audioColaborador?: string | null;
    };
    avaliacoes?: {
        area?: EvaluationCriteria;
        lideranca?: EvaluationCriteria;
        colaborador?: EvaluationCriteria;
    };
    pendencias?: Array<{
        responsible: string;
        description: string;
        deadline?: string | Date | null;
        priority: 'BAIXA' | 'MEDIA' | 'ALTA';
        status?: 'PENDENTE' | 'CONCLUIDA' | 'RESOLVIDA';
    }>;
    anexos?: Array<{
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
        // Apply defaults for optional fields
        const safeData = {
            date: data.date || new Date(),
            masterId: data.masterId,
            collaboratorIds: data.collaboratorIds || [],
            relatos: data.relatos || {},
            avaliacoes: data.avaliacoes || { area: {}, lideranca: {}, colaborador: {} },
            pendencias: data.pendencias || [],
            anexos: data.anexos || [],
            notes: data.notes || [],
        };

        // 1. Resolve Master Profile (User) - only if masterId is provided
        let masterUser = null;
        if (safeData.masterId) {
            masterUser = await prisma.user.findUnique({
                where: { id: safeData.masterId }
            });
            if (!masterUser) throw new Error('Usuário Master não encontrado');
        }

        // 2. Resolve Collaborators (skip if empty)
        // NOTE: Frontend sends User IDs, but we need CollaboratorProfile IDs
        let collaborators: any[] = [];
        if (safeData.collaboratorIds.length > 0) {
            // First try to find by userId (since frontend sends user.id)
            collaborators = await prisma.collaboratorProfile.findMany({
                where: { userId: { in: safeData.collaboratorIds } }
            });

            // If not found by userId, try by id directly (for backwards compatibility)
            if (collaborators.length === 0) {
                collaborators = await prisma.collaboratorProfile.findMany({
                    where: { id: { in: safeData.collaboratorIds } }
                });
            }

            // Log warning if some collaborators not found, but continue
            if (collaborators.length !== safeData.collaboratorIds.length) {
                console.warn(`Warning: Only found ${collaborators.length} of ${safeData.collaboratorIds.length} collaborators`);
            }
        }

        const visitDate = new Date(safeData.date);

        // 3. Transaction for Consistency
        return await prisma.$transaction(async (tx) => {
            // Helper to format evaluations for DB
            const evaluationsToCreate: any[] = [];

            const processEvaluations = (type: string, data: unknown) => {
                if (data && typeof data === 'object') {
                    Object.entries(data as Record<string, unknown>).forEach(([criteria, value]) => {
                        const rating = typeof value === 'number' ? value : (value ? 1 : 0);
                        evaluationsToCreate.push({
                            type,
                            criteria,
                            rating,
                            comment: null // Future: allow comments per criteria
                        });
                    });
                }
            };

            processEvaluations('AREA', safeData.avaliacoes?.area);
            processEvaluations('LIDERANCA', safeData.avaliacoes?.lideranca);
            processEvaluations('COLABORADOR', safeData.avaliacoes?.colaborador);


            // Create Visit
            const visit = await tx.visit.create({
                data: {
                    date: visitDate,
                    time: data.time,
                    companyId: data.companyId,
                    areaId: data.areaId,
                    masterId: masterUser?.id || safeData.masterId || (() => { throw new Error("Master ID obrigatorio") })(),
                    relatoLideranca: safeData.relatos?.lideranca,
                    relatoColaborador: safeData.relatos?.colaborador,
                    relatoConsultoria: safeData.relatos?.consultoria,
                    observacoesMaster: safeData.relatos?.observacoes,
                    audioLiderancaUrl: safeData.relatos?.audioLideranca,
                    audioColaboradorUrl: safeData.relatos?.audioColaborador,
                    collaborators: {
                        connect: collaborators.map(c => ({ id: c.id })) // Connect Many-to-Many
                    },
                    evaluations: {
                        create: evaluationsToCreate
                    }
                }
            });

            // Create Pendencies
            if (safeData.pendencias.length > 0) {
                await tx.pendingItem.createMany({
                    data: safeData.pendencias.map(p => ({
                        visitId: visit.id,
                        description: p.description,
                        responsible: p.responsible,
                        deadline: p.deadline ? new Date(p.deadline) : null,
                        priority: p.priority,
                        status: p.status || 'PENDENTE',
                        companyId: data.companyId
                    }))
                });
            }

            // Create Attachments
            if (safeData.anexos.length > 0) {
                await tx.visitAttachment.createMany({
                    data: safeData.anexos.map(a => ({
                        visitId: visit.id,
                        url: a.url,
                        type: a.type,
                        name: a.name
                    }))
                });
            }

            // Create Individual Notes - only for valid collaborators
            if (safeData.notes && safeData.notes.length > 0) {
                // Get valid collaborator IDs from the ones we already fetched
                const validCollaboratorIds = new Set(collaborators.map(c => c.id));

                // Filter notes to only include valid collaboratorIds
                const validNotes = safeData.notes.filter(n => {
                    if (!n.collaboratorId || !n.content) return false;
                    if (!validCollaboratorIds.has(n.collaboratorId)) {
                        console.warn(`Skipping note for invalid collaboratorId: ${n.collaboratorId}`);
                        return false;
                    }
                    return true;
                });

                if (validNotes.length > 0) {
                    await tx.visitNote.createMany({
                        data: validNotes.map(n => ({
                            visitId: visit.id,
                            collaboratorId: n.collaboratorId,
                            content: n.content
                        }))
                    });
                }
            }

            // AUTO-GENERATE notes from narratives for each collaborator
            // This ensures all narratives (Liderança, Colaborador, Consultoria) are saved as individual notes
            const hasNarratives = safeData.relatos?.lideranca || safeData.relatos?.colaborador || safeData.relatos?.consultoria;
            if (hasNarratives && collaborators.length > 0) {
                const narrativeParts: string[] = [];

                if (safeData.relatos?.lideranca?.trim()) {
                    narrativeParts.push(`📋 **Relato da Liderança:**\n${safeData.relatos.lideranca.trim()}`);
                }
                if (safeData.relatos?.colaborador?.trim()) {
                    narrativeParts.push(`👤 **Relato do Colaborador:**\n${safeData.relatos.colaborador.trim()}`);
                }
                if (safeData.relatos?.consultoria?.trim()) {
                    narrativeParts.push(`💼 **Relato da Consultoria:**\n${safeData.relatos.consultoria.trim()}`);
                }

                if (narrativeParts.length > 0) {
                    const combinedNote = narrativeParts.join('\n\n---\n\n');

                    // Create an auto-generated note for EACH collaborator in the visit
                    await tx.visitNote.createMany({
                        data: collaborators.map(c => ({
                            visitId: visit.id,
                            collaboratorId: c.id,
                            content: combinedNote
                        }))
                    });
                    console.log(`[VisitService] Auto-generated notes for ${collaborators.length} collaborators`);
                }
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
                    company: {
                        select: { id: true, name: true }
                    },
                    area: true,
                    master: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    collaborators: {
                        include: {
                            user: {
                                select: { id: true, name: true }
                            }
                        }
                    },
                    attachments: true,
                    generatedPendencies: true,
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
                collaborators: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                attachments: true,
                evaluations: true, // Fetch evaluations
                generatedPendencies: true,
                notes: { // VisitNotes
                    include: {
                        collaborator: {
                            include: {
                                user: {
                                    select: { name: true }
                                }
                            }
                        }
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
