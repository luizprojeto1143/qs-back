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
    };
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;

        // SECURITY CHECK: Verify if user still exists and is active
        // This prevents access from banned/fired users with valid tokens
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

        console.log('Auth Debug:', {
            tokenRole: verified.role,
            dbRole: userStatus.role,
            userId: verified.userId,
            path: req.path
        });

        (req as AuthRequest).user = verified;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(403).json({ error: 'Invalid token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;
        console.log('Role Check:', {
            required: roles,
            userRole: user?.role,
            hasPermission: user && roles.includes(user.role)
        });

        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
