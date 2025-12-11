import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Limit each IP to 100 requests per windowMs

const requests = new Map<string, { count: number; startTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    const record = requests.get(ip);

    if (!record) {
        requests.set(ip, { count: 1, startTime: now });
        return next();
    }

    if (now - record.startTime > WINDOW_MS) {
        // Reset window
        requests.set(ip, { count: 1, startTime: now });
        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }

    record.count++;
    next();
};
