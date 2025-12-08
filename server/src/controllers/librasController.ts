import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

interface TimeSlot {
    start: string;
    end: string;
}

interface DaySchedule {
    active: boolean;
    slots: TimeSlot[];
}

interface AvailabilitySettings {
    [key: string]: DaySchedule;
}

const DAYS_MAP: { [key: number]: string } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
};

export const checkAvailability = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { librasAvailability: true }
        });

        if (!company?.librasAvailability) {
            return res.json({ available: false, reason: 'Not configured' });
        }

        const settings: AvailabilitySettings = JSON.parse(company.librasAvailability);

        // Get current time in Brazil/Sao_Paulo timezone
        const now = new Date();
        const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

        const currentDayKey = DAYS_MAP[brazilTime.getDay()];
        const daySettings = settings[currentDayKey];

        if (!daySettings || !daySettings.active) {
            return res.json({ available: false, reason: 'Day not active' });
        }

        const currentHour = brazilTime.getHours();
        const currentMinute = brazilTime.getMinutes();
        const currentTimeValue = currentHour * 60 + currentMinute;

        const isAvailable = daySettings.slots.some(slot => {
            const [startHour, startMinute] = slot.start.split(':').map(Number);
            const [endHour, endMinute] = slot.end.split(':').map(Number);

            const startTimeValue = startHour * 60 + startMinute;
            const endTimeValue = endHour * 60 + endMinute;

            return currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
        });

        res.json({ available: isAvailable });

    } catch (error) {
        console.error('Error checking libras availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { librasAvailability: true }
        });

        res.json(company?.librasAvailability ? JSON.parse(company.librasAvailability) : {});
    } catch (error) {
        console.error('Error fetching libras settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const settings = req.body;

        await prisma.company.update({
            where: { id: user.companyId },
            data: { librasAvailability: JSON.stringify(settings) }
        });

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating libras settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
