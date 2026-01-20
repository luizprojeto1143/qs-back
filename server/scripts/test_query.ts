
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function testQuery() {
    try {
        const user = await prisma.user.findFirst({ where: { role: 'MASTER' } });
        if (!user) throw new Error('Master not found');

        console.log('User:', user.id, 'Company:', user.companyId);

        // EXACT QUERY FROM CONTROLLER
        const activeCycle = await prisma.performanceCycle.findFirst({
            where: {
                companyId: user.companyId || undefined,
                status: 'ACTIVE'
            }
        });

        console.log('Result with user.companyId:', activeCycle ? 'FOUND' : 'NOT FOUND');
        if (activeCycle) console.log(activeCycle);

        // Test with undefined explicitly if user.companyId was null
        if (!user.companyId) {
            const activeCycleUndef = await prisma.performanceCycle.findFirst({
                where: {
                    companyId: undefined,
                    status: 'ACTIVE'
                }
            });
            console.log('Result with undefined:', activeCycleUndef ? 'FOUND' : 'NOT FOUND');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testQuery();
