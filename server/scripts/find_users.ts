
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function findUsers() {
    try {
        const master = await prisma.user.findFirst({ where: { role: 'MASTER' } });
        if (!master) {
            console.log('No MASTER user found.');
            return;
        }

        const others = await prisma.user.findMany({
            where: {
                companyId: master.companyId,
                NOT: { id: master.id }
            },
            take: 5
        });

        console.log('Master ID:', master.id);
        console.log('--- Other Users ---');
        console.table(others.map(u => ({ id: u.id, name: u.name, role: u.role })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findUsers();
