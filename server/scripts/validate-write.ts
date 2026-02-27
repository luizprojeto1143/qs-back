
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTIC START (TRANSACTION MODE) ---');
    try {
        console.log('1. Testing Database Connection...');
        await prisma.$connect();
        console.log('✅ Connected.');

        console.log('2. Attempting Transaction Write...');
        const result = await prisma.$transaction(async (tx) => {
            const log1 = await tx.auditLog.create({
                data: {
                    action: 'DIAGNOSTIC_TX_1',
                    details: 'Step 1 of transaction',
                    ipAddress: '127.0.0.1'
                }
            });
            console.log('   Step 1 OK');

            const log2 = await tx.auditLog.create({
                data: {
                    action: 'DIAGNOSTIC_TX_2',
                    details: 'Step 2 of transaction',
                    ipAddress: '127.0.0.1'
                }
            });
            console.log('   Step 2 OK');

            return [log1, log2];
        });

        console.log('✅ Transaction Successful! Created logs:', result.map(l => l.id).join(', '));

        console.log('3. Cleaning up...');
        await prisma.auditLog.deleteMany({
            where: { id: { in: result.map(l => l.id) } }
        });
        console.log('✅ Cleanup Successful.');

        console.log('--- DIAGNOSTIC RESULT: PASS ---');
    } catch (error: any) {
        console.error('❌ DIAGNOSTIC FAILED');
        console.error('Error Code:', error.code);
        console.error('Message:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
