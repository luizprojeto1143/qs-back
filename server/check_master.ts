
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const master = await prisma.user.findUnique({
            where: { email: 'master@qs.com' },
            select: { id: true, name: true, role: true, companyId: true }
        });
        console.log('Master User:', master);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
