import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration of shift values...');

    // Update MANHA -> 1_TURNO
    const updateManha = await prisma.collaboratorProfile.updateMany({
        where: { shift: 'MANHA' },
        data: { shift: '1_TURNO' }
    });
    console.log(`Updated ${updateManha.count} records from MANHA to 1_TURNO`);

    // Update TARDE -> 2_TURNO
    const updateTarde = await prisma.collaboratorProfile.updateMany({
        where: { shift: 'TARDE' },
        data: { shift: '2_TURNO' }
    });
    console.log(`Updated ${updateTarde.count} records from TARDE to 2_TURNO`);

    // Update NOITE -> 3_TURNO
    const updateNoite = await prisma.collaboratorProfile.updateMany({
        where: { shift: 'NOITE' },
        data: { shift: '3_TURNO' }
    });
    console.log(`Updated ${updateNoite.count} records from NOITE to 3_TURNO`);

    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
