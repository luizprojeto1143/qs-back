
import { Request, Response } from 'express';
import prisma from '../prisma';

export const checkStatus = async (req: Request, res: Response) => {
    try {
        // Test basic DB connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected' });
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
