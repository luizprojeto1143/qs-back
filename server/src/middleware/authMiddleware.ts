import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined.');
}

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        companyId: string | null;
        areaId?: string | null;
        email?: string; // Optional for now, populated if available
    };
}

export const getIp = (req: Request) => {
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
};

export const getUserAgent = (req: Request) => {
    return req.headers['user-agent'] || '';
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;
        console.log('[Auth] Detected Token Payload:', JSON.stringify(verified));

        if (!verified || !verified.userId) {
            console.error('[Auth] Token missing userId');
            return res.status(403).json({ error: 'Invalid token structure' });
        }

        // SECURITY CHECK: Verify if user still exists and is active
        const userStatus = await prisma.user.findUnique({
            where: { id: verified.userId },
            select: { active: true, companyId: true, role: true, areaId: true }
        });

        if (!userStatus || !userStatus.active) {
            return res.status(403).json({ error: 'Account disabled or not found' });
        }

        // Allow MASTER users to switch company context via header
        if (verified.role === 'MASTER' && req.headers['x-company-id']) {
            const contextCompanyId = req.headers['x-company-id'] as string;

            // Basic format validation (UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(contextCompanyId)) {
                return res.status(400).json({ error: 'Invalid Company ID format' });
            }

            verified.companyId = contextCompanyId;
        } else {
            // Ensure token companyId matches current DB state (in case user was moved)
            verified.companyId = userStatus.companyId;
            verified.role = userStatus.role; // Refresh role as well
            verified.areaId = userStatus.areaId;
        }

        (req as AuthRequest).user = verified;
        next();
    } catch (error) {
        console.error('FATAL Auth Error:', error);
        // @ts-ignore
        const errorMessage = error.message || 'Unknown error';
        console.error('Auth Error Details:', errorMessage);

        if (errorMessage.includes('jwt')) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // If it's not JWT, it might be DB
        console.error('[Auth] Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        res.status(500).json({
            error: 'Internal Auth Validation Error',
            details: errorMessage,
            raw: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;


        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
