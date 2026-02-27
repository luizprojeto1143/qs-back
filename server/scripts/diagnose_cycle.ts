
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('--- USERS (MASTER) ---');
        const masters = await prisma.user.findMany({
            where: { role: 'MASTER' },
            select: { id: true, name: true, email: true, companyId: true }
        });
        console.table(masters);

        console.log('\n--- ACTIVE CYCLES ---');
        const cycles = await prisma.performanceCycle.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, companyId: true, status: true }
        });
        console.table(cycles);

        if (masters.length > 0 && cycles.length > 0) {
            const masterCompId = masters[0].companyId;
            const cycleCompId = cycles[0].companyId;
            console.log(`\nMatch Check: Master Company (${masterCompId}) === Cycle Company (${cycleCompId})? ${masterCompId === cycleCompId}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
