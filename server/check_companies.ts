
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.company.count();
        console.log(`Total companies found: ${count}`);

        const companies = await prisma.company.findMany({
            select: { id: true, name: true, active: true }
        });
        console.log('Companies:', companies);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
