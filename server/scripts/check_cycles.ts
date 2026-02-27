
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function checkCycles() {
    try {
        const cycles = await prisma.performanceCycle.findMany({
            include: {
                company: true
            }
        });

        console.log('--- Active Performance Cycles ---');
        if (cycles.length === 0) {
            console.log('No cycles found.');
        } else {
            console.table(cycles.map(c => ({
                id: c.id,
                name: c.name,
                company: c.company.name,
                status: c.status,
                start: c.startDate.toISOString().split('T')[0],
                end: c.endDate.toISOString().split('T')[0]
            })));
        }
    } catch (error) {
        console.error('Error fetching cycles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCycles();
