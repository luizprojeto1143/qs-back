import { Request, Response } from 'express';
import prisma from '../prisma';

export const workScheduleController = {
    // Obter escala de um colaborador
    async get(req: Request, res: Response) {
        try {
            const { collaboratorId } = req.params;

            const schedule = await prisma.workSchedule.findUnique({
                where: { collaboratorId },
                include: {
                    collaborator: {
                        include: {
                            user: { select: { name: true } },
                            area: { select: { name: true } }
                        }
                    }
                }
            });

            if (!schedule) {
                return res.status(404).json({ error: 'Escala não encontrada' });
            }

            res.json(schedule);
        } catch (error) {
            console.error('Error getting schedule:', error);
            res.status(500).json({ error: 'Erro ao obter escala' });
        }
    },

    // Criar ou atualizar escala
    async upsert(req: Request, res: Response) {
        try {
            const { collaboratorId } = req.params;
            const {
                type, // 5X2, 6X1, 12X36, 4X3, PERSONALIZADO
                workDays, // [1,2,3,4,5] (seg a sex)
                startTime,
                endTime,
                breakStart,
                breakEnd,
                restDays, // [0,6] (dom e sab)
                notes,
            } = req.body;

            const schedule = await prisma.workSchedule.upsert({
                where: { collaboratorId },
                create: {
                    collaboratorId,
                    type,
                    workDays: JSON.stringify(workDays || [1, 2, 3, 4, 5]),
                    startTime: startTime || '08:00',
                    endTime: endTime || '17:00',
                    breakStart,
                    breakEnd,
                    restDays: JSON.stringify(restDays || [0, 6]),
                    notes,
                },
                update: {
                    type,
                    workDays: workDays ? JSON.stringify(workDays) : undefined,
                    startTime,
                    endTime,
                    breakStart,
                    breakEnd,
                    restDays: restDays ? JSON.stringify(restDays) : undefined,
                    notes,
                }
            });

            // Update Collaborator Profile with Next Rest Day if provided
            if (req.body.nextRestDay) {
                await prisma.collaboratorProfile.update({
                    where: { id: collaboratorId },
                    data: { nextRestDay: new Date(req.body.nextRestDay) }
                });
            }

            res.json(schedule);
        } catch (error) {
            console.error('Error upserting schedule:', error);
            res.status(500).json({ error: 'Erro ao salvar escala' });
        }
    },

    // Listar escalas de uma empresa
    async listByCompany(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            const schedules = await prisma.workSchedule.findMany({
                where: {
                    collaborator: {
                        area: {
                            sector: { companyId }
                        }
                    }
                },
                include: {
                    collaborator: {
                        include: {
                            user: { select: { name: true } },
                            area: { select: { name: true } }
                        }
                    }
                }
            });

            res.json(schedules);
        } catch (error) {
            console.error('Error listing schedules:', error);
            res.status(500).json({ error: 'Erro ao listar escalas' });
        }
    },

    // Calcular próximas folgas
    async getNextDaysOff(req: Request, res: Response) {
        try {
            const { collaboratorId } = req.params;
            const { days = 30 } = req.query;

            const schedule = await prisma.workSchedule.findUnique({
                where: { collaboratorId }
            });

            if (!schedule) {
                return res.status(404).json({ error: 'Escala não encontrada' });
            }

            // Buscar folgas registradas
            const registeredDaysOff = await prisma.dayOff.findMany({
                where: {
                    collaboratorId,
                    date: { gte: new Date() }
                },
                orderBy: { date: 'asc' }
            });

            // Calcular folgas baseadas na escala
            const restDays = JSON.parse(schedule.restDays || '[]');
            const today = new Date();
            const daysOffFromSchedule: Date[] = [];

            for (let i = 0; i < Number(days); i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                const dayOfWeek = date.getDay();

                if (restDays.includes(dayOfWeek)) {
                    daysOffFromSchedule.push(date);
                }
            }

            res.json({
                schedule: {
                    type: schedule.type,
                    workDays: JSON.parse(schedule.workDays || '[]'),
                    restDays,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                },
                registeredDaysOff: registeredDaysOff.map(d => ({
                    date: d.date,
                    type: d.type,
                    reason: d.reason,
                })),
                calculatedDaysOff: daysOffFromSchedule.slice(0, 10).map(d => d.toISOString().split('T')[0]),
            });
        } catch (error) {
            console.error('Error getting next days off:', error);
            res.status(500).json({ error: 'Erro ao calcular folgas' });
        }
    },
};

export const dayOffController = {
    // Registrar folga
    async create(req: Request, res: Response) {
        try {
            const {
                collaboratorId,
                date,
                endDate,
                type, // FOLGA, FERIAS, LICENCA, FERIADO, ATESTADO, COMPENSACAO
                reason,
            } = req.body;
            const user = (req as any).user;

            // Determine effective collaborator ID (self or requested)
            const targetCollaboratorId = user.role === 'COLABORADOR'
                ? (await prisma.collaboratorProfile.findUnique({ where: { userId: user.userId } }))?.id
                : collaboratorId;

            if (!targetCollaboratorId) {
                return res.status(400).json({ error: 'Perfil de colaborador não encontrado' });
            }

            const isAutoApproved = user.role !== 'COLABORADOR';

            const dayOff = await prisma.dayOff.create({
                data: {
                    collaboratorId: targetCollaboratorId,
                    date: new Date(date),
                    endDate: endDate ? new Date(endDate) : null,
                    type,
                    reason,
                    approved: isAutoApproved,
                    approvedById: isAutoApproved ? user.userId : null,
                }
            });

            // If not auto-approved, create a PendingItem for the Master/Leader dashboard
            if (!isAutoApproved && user.companyId) {
                await prisma.pendingItem.create({
                    data: {
                        description: `Solicitação de ${type} (${new Date(date).toLocaleDateString()}): ${reason}`,
                        responsible: 'LIDERANÇA',
                        priority: 'MEDIA',
                        status: 'PENDENTE',
                        companyId: user.companyId,
                        collaboratorId: targetCollaboratorId,
                    }
                });
            }

            res.status(201).json(dayOff);
        } catch (error) {
            console.error('Error creating day off:', error);
            res.status(500).json({ error: 'Erro ao registrar folga' });
        }
    },

    // Listar folgas de um colaborador
    async listByCollaborator(req: Request, res: Response) {
        try {
            const { collaboratorId } = req.params;
            const { startDate, endDate } = req.query;

            const where: any = { collaboratorId };
            if (startDate || endDate) {
                where.date = {};
                if (startDate) where.date.gte = new Date(startDate as string);
                if (endDate) where.date.lte = new Date(endDate as string);
            }

            const daysOff = await prisma.dayOff.findMany({
                where,
                orderBy: { date: 'asc' },
                include: {
                    approvedBy: { select: { name: true } }
                }
            });

            res.json(daysOff);
        } catch (error) {
            console.error('Error listing days off:', error);
            res.status(500).json({ error: 'Erro ao listar folgas' });
        }
    },

    // Deletar folga
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await prisma.dayOff.delete({ where: { id } });

            res.json({ message: 'Folga removida com sucesso' });
        } catch (error) {
            console.error('Error deleting day off:', error);
            res.status(500).json({ error: 'Erro ao remover folga' });
        }
    },
    // List pending days off for company leaders
    async listPending(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user.companyId || (user.role !== 'MASTER' && user.role !== 'LIDER' && user.role !== 'RH')) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const pending = await prisma.dayOff.findMany({
                where: {
                    approved: false,
                    collaborator: {
                        area: {
                            sector: { companyId: user.companyId }
                        }
                    }
                },
                include: {
                    collaborator: {
                        include: {
                            user: { select: { name: true, role: true } },
                            area: { select: { name: true } }
                        }
                    }
                },
                orderBy: { date: 'asc' }
            });

            res.json(pending);
        } catch (error) {
            console.error('Error listing pending days off:', error);
            res.status(500).json({ error: 'Error listing pending' });
        }
    },

    // Approve/Reject Day Off
    async review(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { action } = req.body; // 'APPROVE' or 'REJECT'
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'LIDER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Get current day off details before update/delete
            const existingDayOff = await prisma.dayOff.findUnique({ where: { id } });
            if (!existingDayOff) return res.status(404).json({ error: 'Not found' });

            // Try to find and resolve related PendingItem
            // We search for a PENDING item for this collaborator with "Solicitação" in description
            // This is a heuristic since we don't have a direct link ID.
            if (existingDayOff.collaboratorId) {
                const relatedPendency = await prisma.pendingItem.findFirst({
                    where: {
                        collaboratorId: existingDayOff.collaboratorId,
                        status: 'PENDENTE',
                        description: { contains: new Date(existingDayOff.date).toLocaleDateString() }
                    }
                });

                if (relatedPendency) {
                    await prisma.pendingItem.update({
                        where: { id: relatedPendency.id },
                        data: {
                            status: action === 'APPROVE' ? 'RESOLVIDA' : 'CONCLUIDA', // Or just RESOLVIDA
                            resolvedAt: new Date()
                        }
                    });
                }
            }

            if (action === 'REJECT') {
                await prisma.dayOff.delete({ where: { id } });
                return res.json({ message: 'Rejected/Deleted' });
            }

            const dayOff = await prisma.dayOff.update({
                where: { id },
                data: {
                    approved: true,
                    approvedById: user.userId
                }
            });

            res.json(dayOff);
        } catch (error) {
            console.error('Error reviewing day off:', error);
            res.status(500).json({ error: 'Error processing review' });
        }
    },
};
