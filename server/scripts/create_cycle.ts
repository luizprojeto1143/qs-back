
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createInitialCycle() {
    try {
        // 1. Find the company of the Master user
        const masterUser = await prisma.user.findFirst({
            where: { role: 'MASTER' }
        });

        if (!masterUser || !masterUser.companyId) {
            console.error('Master user or company not found.');
            return;
        }

        const companyId = masterUser.companyId;

        // 2. Check if a cycle already exists
        const existingCycle = await prisma.performanceCycle.findFirst({
            where: { companyId, status: 'ACTIVE' }
        });

        if (existingCycle) {
            console.log('Active cycle already exists:', existingCycle.name);
            // Ensure a review exists for this cycle
            await ensureReviewExists(prisma, existingCycle.id, masterUser.id);
            return;
        }

        // 3. Create a new test cycle (REMOVED DESCRIPTION field as it is not in schema)
        const newCycle = await prisma.performanceCycle.create({
            data: {
                name: 'Ciclo de Avaliação Q1 2026',
                // description: 'Primeiro ciclo...', // Removed
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: 'ACTIVE',
                companyId: companyId
            }
        });

        console.log('Created new Performance Cycle:', newCycle);

        // 4. Create a self-review
        await ensureReviewExists(prisma, newCycle.id, masterUser.id);

    } catch (error) {
        console.error('Error creating cycle:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function ensureReviewExists(prisma: any, cycleId: string, userId: string) {
    const existingReview = await prisma.performanceReview.findUnique({
        where: {
            cycleId_reviewerId_revieweeId: {
                cycleId: cycleId,
                reviewerId: userId,
                revieweeId: userId
            }
        }
    });

    if (existingReview) {
        console.log('Self-review already exists:', existingReview.id);
    } else {
        const selfReview = await prisma.performanceReview.create({
            data: {
                cycleId: cycleId,
                reviewerId: userId,
                revieweeId: userId,
                type: 'SELF',
                status: 'PENDING'
            }
        });
        console.log('Created Self-Review for Master User:', selfReview);
    }
}

createInitialCycle();
