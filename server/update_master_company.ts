import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) {
        console.log('No company found');
        return;
    }

    const master = await prisma.user.update({
        where: { email: 'master@qs.com' },
        data: { companyId: company.id }
    });

    console.log('Updated Master user with company:', master);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
