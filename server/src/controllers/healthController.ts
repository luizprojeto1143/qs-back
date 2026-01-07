
import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const checkStatus = async (req: Request, res: Response) => {
    try {
        // Test actual table access (Auth uses this table)
        const userCount = await prisma.user.count();
        const oneUser = await prisma.user.findFirst({ select: { id: true, email: true } });

        res.json({
            status: 'ok',
            database: 'connected',
            userCount,
            sampleUser: oneUser ? 'Found' : 'None',
            env: process.env.NODE_ENV
        });
    } catch (error) {
        sendError500(res, ERROR_CODES.HEALTH_CHECK, error);
    }
};
