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



export const checkAvailability = async (req: Request, res: Response) => {
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

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

        // Get current time in Brazil/Sao_Paulo timezone using Intl.DateTimeFormat for robustness
        const timeZone = 'America/Sao_Paulo';
        const now = new Date();

        const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' });
        const currentDayKey = dayFormatter.format(now).toLowerCase(); // 'monday', 'tuesday', etc.

        const daySettings = settings[currentDayKey];

        if (!daySettings || !daySettings.active) {
            return res.json({ available: false, reason: 'Day not active' });
        }

        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });

        // format returns "HH:MM"
        const timeString = timeFormatter.format(now);
        const [currentHour, currentMinute] = timeString.split(':').map(Number);
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
