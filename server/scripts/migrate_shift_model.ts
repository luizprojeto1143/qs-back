import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration of Shift model records...');

    // Update MANHA -> 1_TURNO
    const updateManha = await prisma.shift.updateMany({
        where: { name: 'MANHA' },
        data: { name: '1º Turno' } // Use display name for dynamic shifts
    });
    console.log(`Updated ${updateManha.count} Shift records from MANHA to 1º Turno`);

    // Update TARDE -> 2_TURNO
    const updateTarde = await prisma.shift.updateMany({
        where: { name: 'TARDE' },
        data: { name: '2º Turno' }
    });
    console.log(`Updated ${updateTarde.count} Shift records from TARDE to 2º Turno`);

    // Update NOITE -> 3_TURNO
    const updateNoite = await prisma.shift.updateMany({
        where: { name: 'NOITE' },
        data: { name: '3º Turno' }
    });
    console.log(`Updated ${updateNoite.count} Shift records from NOITE to 3º Turno`);

    // Also check for "Manhã", "Tarde", "Noite" (case sensitive or not)
    // Since Prisma updateMany is case sensitive usually, let's try common variations if needed.
    // But for now, let's stick to the likely values.

    console.log('Shift model migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
