import { Request, Response } from 'express';
import prisma from '../prisma';

export const listNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating notification' });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating notifications' });
    }
};
