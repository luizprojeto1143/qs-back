import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

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
        sendError500(res, ERROR_CODES.NOTIF_LIST, error);
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
        sendError500(res, ERROR_CODES.NOTIF_READ, error);
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
        sendError500(res, ERROR_CODES.NOTIF_READ_ALL, error);
    }
};
