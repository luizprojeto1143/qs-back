import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'lider@empresa.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the first company
    const company = await prisma.company.findFirst();

    if (!company) {
        console.error('No company found!');
        return;
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Líder Teste',
            password: hashedPassword,
            role: 'LIDER',
            companyId: company.id
        }
    });

    console.log('Leader user created:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
