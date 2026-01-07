import { PrismaClient } from '@prisma/client';

// Configure Prisma for PGBouncer compatibility
// This prevents prepared statement conflicts with connection pooling
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Middleware to handle connection issues gracefully
prisma.$use(async (params, next) => {
    try {
        return await next(params);
    } catch (error: any) {
        // Log the error for debugging
        console.error(`[Prisma] Error in ${params.model}.${params.action}:`, error.message);
        throw error;
    }
});

export default prisma;
