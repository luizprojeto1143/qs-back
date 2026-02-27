
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createPeerReview() {
    try {
        const master = await prisma.user.findFirst({ where: { role: 'MASTER' } });
        if (!master || !master.companyId) {
            console.error('Master user or company not found.');
            return;
        }

        const companyId = master.companyId;

        // 1. Create a dummy peer user
        const dummyPeer = await prisma.user.create({
            data: {
                name: 'Maria Oliveira (Colega)',
                email: 'maria.test@example.com',
                password: 'hashed_password_placeholder',
                role: 'COLABORADOR',
                companyId: companyId
            }
        });
        console.log('Created dummy peer:', dummyPeer.name);

        // 2. Find Active Cycle
        const cycle = await prisma.performanceCycle.findFirst({
            where: { companyId, status: 'ACTIVE' }
        });

        if (!cycle) {
            console.error('No active cycle found.');
            return;
        }

        // 3. Create Peer Review: Master evaluates Maria
        await prisma.performanceReview.create({
            data: {
                cycleId: cycle.id,
                reviewerId: master.id,
                revieweeId: dummyPeer.id,
                type: 'PEER',
                status: 'PENDING'
            }
        });

        console.log('Created PEER review task for Master.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createPeerReview();
