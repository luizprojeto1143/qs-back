import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { date, time, reason, collaboratorId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Combine date and time into a single DateTime string
        // Assuming date is YYYY-MM-DD and time is HH:MM
        const scheduleDate = new Date(`${date}T${time}:00.000Z`);

        const schedule = await prisma.schedule.create({
            data: {
                date: scheduleDate,
                status: 'PENDENTE',
                companyId: user.companyId,
                requesterId: user.userId,
                collaboratorId: collaboratorId || null,
                notes: reason,
            }
        });

        // NOTIFICATION LOGIC
        // Find users with role MASTER or RH in the same company
        const admins = await prisma.user.findMany({
            where: {
                companyId: user.companyId,
                role: { in: ['MASTER', 'RH'] }
            }
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map(admin => ({
                    userId: admin.id,
                    title: 'Novo Agendamento',
                    message: `Novo agendamento solicitado por ${(req as any).user.name || 'Usuário'} para ${date} às ${time}.`,
                    link: '/dashboard/schedules'
                }))
            });
        }

        res.status(201).json(schedule);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'Error creating schedule' });
    }
};

export const listSchedules = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const where: any = {};

        // Security: Always filter by companyId unless MASTER explicitly requests otherwise (and we might want to restrict that too)
        // For now, let's assume MASTER also needs to see only their selected company context
        const companyId = req.headers['x-company-id'] as string || user.companyId;

        if (companyId) {
            where.companyId = companyId;
        } else if (user.role !== 'MASTER') {
            // If not master and no companyId, error
            return res.status(400).json({ error: 'Company context required' });
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
            area: s.collaborator?.area.name
        }));

        res.json(formattedSchedules);
    } catch (error) {
        console.error('Error listing schedules:', error);
        res.status(500).json({ error: 'Error listing schedules' });
    }
};

export const updateScheduleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'APROVADO' | 'RECUSADO'
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

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
        res.status(500).json({ error: 'Error updating schedule status' });
    }
};
