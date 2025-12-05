
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected successfully.');

        console.log('Fetching companies...');
        const companies = await prisma.company.findMany();
        console.log(`Found ${companies.length} companies.`);

        await prisma.$disconnect();
    } catch (e) {
        console.error('Database connection error:', e);
        process.exit(1);
    }
}

main();
