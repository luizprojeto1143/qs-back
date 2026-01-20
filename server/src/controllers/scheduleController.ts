import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { createScheduleSchema } from '../schemas/dataSchemas';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const createSchedule = async (req: Request, res: Response) => {
    try {
        const validation = createScheduleSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { date, time, reason, collaboratorId } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Combine date and time into a single DateTime string
        const scheduleDate = new Date(`${date}T${time}:00.000Z`);

        // ============================================
        // AVAILABILITY VALIDATION
        // ============================================
        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { availability: true }
        });

        if (company?.availability) {
            try {
                const availability = JSON.parse(company.availability);
                const dayOfWeek = scheduleDate.getUTCDay(); // 0 = Sunday (UTC), matching the UTC date constructed above

                // Map day number to key names in availability object
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayKey = dayNames[dayOfWeek];

                const dayConfig = availability[dayKey];

                // Check if day is active (use 'active' which is the saved format)
                if (!dayConfig || !dayConfig.active) {
                    return res.status(400).json({
                        error: 'Data não disponível para agendamento',
                        message: 'Este dia da semana não está habilitado para agendamentos.'
                    });
                }

                // Check time against slots
                if (dayConfig.slots && dayConfig.slots.length > 0 && time) {
                    let timeInSlot = false;
                    for (const slot of dayConfig.slots) {
                        if (time >= slot.start && time <= slot.end) {
                            timeInSlot = true;
                            break;
                        }
                    }
                    if (!timeInSlot) {
                        const ranges = dayConfig.slots.map((s: any) => `${s.start}-${s.end}`).join(', ');
                        return res.status(400).json({
                            error: 'Horário não disponível',
                            message: `Agendamentos só são permitidos nos horários: ${ranges}`
                        });
                    }
                }
            } catch (parseError) {
                console.error('Error parsing availability:', parseError);
                return res.status(500).json({
                    error: 'Configuration Error',
                    message: 'Erro ao validar disponibilidade da empresa. Entre em contato com o suporte.'
                });
            }
        }
        // ============================================

        // TRANSACTION: Create Schedule + Notifications
        const result = await prisma.$transaction(async (prisma) => {
            // RACE CONDITION CHECK (Moved inside transaction)
            if (collaboratorId) {
                const existingSchedule = await prisma.schedule.findFirst({
                    where: {
                        collaboratorId,
                        date: scheduleDate,
                        status: { not: 'RECUSADO' }
                    }
                });

                if (existingSchedule) {
                    throw new Error('Collaborator already has a schedule at this time');
                }
            }

            const schedule = await prisma.schedule.create({
                data: {
                    date: scheduleDate,
                    status: 'PENDENTE',
                    companyId: user.companyId!,
                    requesterId: user.userId,
                    collaboratorId: collaboratorId || null,
                    notes: reason,
                }
            });

            // Find users with role MASTER or RH in the same company
            const admins = await prisma.user.findMany({
                where: {
                    companyId: user.companyId,
                    role: { in: ['MASTER', 'RH'] }
                }
            });

            if (admins.length > 0) {
                // Fetch requester name for notification
                const requester = await prisma.user.findUnique({ where: { id: user.userId } });
                const requesterName = requester?.name || 'Usuário';

                await prisma.notification.createMany({
                    data: admins.map(admin => ({
                        userId: admin.id,
                        title: 'Novo Agendamento',
                        message: `Novo agendamento solicitado por ${requesterName} para ${date} às ${time}.`,
                        link: '/dashboard/schedules'
                    }))
                });
            }

            return schedule;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Error creating schedule:', error);
        if (error.message === 'Collaborator already has a schedule at this time') {
            return res.status(409).json({ error: error.message });
        }
        sendError500(res, ERROR_CODES.SCHED_CREATE, error);
    }
};

export const listSchedules = async (req: Request, res: Response) => {
    // ... (unchanged)
    try {
        const user = (req as AuthRequest).user;
        const { date, area, status } = req.query;

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const where: any = {};

        const companyId = req.headers['x-company-id'] as string || user.companyId;

        if (companyId) {
            where.companyId = companyId;
        } else if (user.role !== 'MASTER') {
            return res.status(400).json({ error: 'Company context required' });
        }

        // Apply Filters
        if (date) {
            // Filter by specific date (ignoring time)
            const startDate = new Date(date as string);
            startDate.setUTCHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setUTCHours(23, 59, 59, 999);

            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        if (status) {
            where.status = status;
        }

        if (area) {
            where.collaborator = {
                area: {
                    name: area as string
                }
            };
        }

        const schedules = await prisma.schedule.findMany({
            where,
            include: {
                requester: {
                    select: { name: true, role: true }
                },
                collaborator: {
                    include: {
                        user: {
                            select: { name: true }
                        },
                        area: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Format for frontend
        const formattedSchedules = schedules.map(s => ({
            id: s.id,
            date: s.date,
            time: s.date.toISOString().split('T')[1].substring(0, 5), // Extract HH:MM
            reason: s.notes,
            status: s.status,
            requester: s.requester.name,
            collaborator: s.collaborator?.user.name,
            area: s.collaborator?.area.name,
            companyId: s.companyId // Needed for frontend filtering/grouping
        }));

        res.json(formattedSchedules);
    } catch (error) {
        sendError500(res, ERROR_CODES.SCHED_LIST, error);
    }
};

export const updateScheduleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'APROVADO' | 'RECUSADO'
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Validate Status Enum
        const VALID_STATUSES = ['PENDENTE', 'APROVADO', 'RECUSADO', 'REMARCADO', 'REALIZADO', 'CANCELADO'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

        if (user.role !== 'MASTER' && schedule.companyId !== user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedSchedule = await prisma.schedule.update({
            where: { id },
            data: { status }
        });

        res.json(updatedSchedule);
    } catch (error) {
        sendError500(res, ERROR_CODES.SCHED_UPDATE, error);
    }
};
