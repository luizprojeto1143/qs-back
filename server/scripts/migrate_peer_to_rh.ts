
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function migratePeerToRh() {
    try {
        console.log('Migrating PEER reviews to RH reviews...');
        const result = await prisma.performanceReview.updateMany({
            where: { type: 'PEER' },
            data: { type: 'RH' }
        });
        console.log(`Updated ${result.count} reviews from PEER to RH.`);
    } catch (error) {
        console.error('Error migrating data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migratePeerToRh();
