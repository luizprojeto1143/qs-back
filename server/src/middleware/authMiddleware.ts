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
        // Using $queryRaw to bypass PGBouncer prepared statement issues
        console.log(`[Auth] Querying User ID via $queryRaw: ${verified.userId}`);

        const userResults = await prisma.$queryRaw<Array<{
            active: boolean;
            companyId: string | null;
            role: string;
            areaId: string | null;
        }>>`SELECT active, "companyId", role, "areaId" FROM "User" WHERE id = ${verified.userId} LIMIT 1`;

        const userStatus = userResults.length > 0 ? userResults[0] : null;

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
    } catch (error: any) {
        console.error('FATAL Auth Error:', error);

        const errorMessage = error.message || 'Unknown error';
        console.error('Auth Error Details:', errorMessage);

        // Explicitly handle JWT errors
        if (errorMessage.includes('jwt') || errorMessage.includes('invalid signature')) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Return detailed error for debugging purposes (Temporary)
        res.status(500).json({
            error: 'Internal Auth Validation Error',
            message: errorMessage,
            stack: error.stack,
            type: error.constructor.name
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
