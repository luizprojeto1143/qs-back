
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
            librasAvailability: true
        }
    });
    console.log(JSON.stringify(companies, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
