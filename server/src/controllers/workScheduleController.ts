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

            const dayOff = await prisma.dayOff.create({
                data: {
                    collaboratorId,
                    date: new Date(date),
                    endDate: endDate ? new Date(endDate) : null,
                    type,
                    reason,
                    approved: true,
                    approvedById: user.userId,
                }
            });

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
};
