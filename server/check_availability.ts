
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findFirst({
        where: {
            // Pega a primeira empresa. Em dev só deve ter uma relevante ou poucas.
        },
        include: { users: true }
    });

    if (!company) {
        console.log('Nenhuma empresa encontrada');
        return;
    }

    console.log('Empresa:', company.name);
    console.log('ID:', company.id);
    console.log('Availability (Raw):', company.availability);

    try {
        if (company.availability) {
            console.log('Availability (Parsed):', JSON.stringify(JSON.parse(company.availability), null, 2));
        } else {
            console.log('Availability is NULL');
        }
    } catch (e) {
        console.error('Erro ao parsear JSON:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
