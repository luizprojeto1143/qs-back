import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        companyId: string | null;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;

        // Allow MASTER users to switch company context via header
        if (verified.role === 'MASTER' && req.headers['x-company-id']) {
            const contextCompanyId = req.headers['x-company-id'] as string;
            // Ideally we should verify if this company exists, but for now we trust the ID format
            // or we could do a quick check if needed, but let's keep it lightweight
            verified.companyId = contextCompanyId;
        }

        (req as AuthRequest).user = verified;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
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
