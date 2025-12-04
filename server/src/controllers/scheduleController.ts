import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { date, time, reason } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Combine date and time into a single DateTime string
        const scheduleDate = new Date(`${date}T${time}:00.000Z`);

        const schedule = await prisma.schedule.create({
            data: {
                date: scheduleDate,
                status: 'PENDENTE',
                companyId: user.companyId,
                requesterId: user.userId,
                notes: reason,
                // If the user is a collaborator, link their profile
                // For now we assume the requester is the one needing support
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

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const schedules = await prisma.schedule.findMany({
            where: {
                companyId: user.companyId
            },
            include: {
                requester: {
                    select: { name: true, role: true }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        res.json(schedules);
    } catch (error) {
        console.error('Error listing schedules:', error);
        res.status(500).json({ error: 'Error listing schedules' });
    }
};
