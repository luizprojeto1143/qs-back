import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', err);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    if (err.code === 'P2002') { // Prisma Unique Constraint Violation
        return res.status(409).json({ error: 'Unique constraint violation. Resource already exists.' });
    }

    if (err.code === 'P2025') { // Prisma Record Not Found
        return res.status(404).json({ error: 'Resource not found' });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
