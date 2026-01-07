
import { Request, Response } from 'express';
import prisma from '../prisma';

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
    } catch (error: any) {
        console.error('Health Check Failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            details: error.message,
            stack: error.stack
        });
    }
};
