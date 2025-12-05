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
        if (user.role !== 'MASTER') {
            if (!user.companyId) {
                return res.status(400).json({ error: 'Company not found' });
            }
            where.companyId = user.companyId;
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

        const schedule = await prisma.schedule.update({
            where: { id },
            data: { status }
        });

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Error updating schedule status' });
    }
};
