import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DATABASE HEALTH CHECK ===\n');

    try {
        // Check connection
        await prisma.$connect();
        console.log('✅ Database connection: OK\n');

        // Count records in each table
        const counts = {
            users: await prisma.user.count(),
            companies: await prisma.company.count(),
            collaboratorProfiles: await prisma.collaboratorProfile.count(),
            areas: await prisma.area.count(),
            sectors: await prisma.sector.count(),
            visits: await prisma.visit.count(),
            schedules: await prisma.schedule.count(),
            feedPosts: await prisma.feedPost.count(),
            pendingItems: await prisma.pendingItem.count(),
            notifications: await prisma.notification.count(),
        };

        console.log('📊 TABLE RECORD COUNTS:');
        console.log('------------------------');
        let totalRecords = 0;
        for (const [table, count] of Object.entries(counts)) {
            console.log(`  ${table}: ${count}`);
            totalRecords += count;
        }
        console.log('------------------------');
        console.log(`  TOTAL: ${totalRecords} records\n`);

        if (totalRecords === 0) {
            console.log('⚠️  WARNING: Database appears to be EMPTY!');
        } else {
            console.log('✅ Database has data');
        }

        // Show first user if exists
        if (counts.users > 0) {
            const firstUser = await prisma.user.findFirst({
                select: { id: true, name: true, email: true, role: true }
            });
            console.log('\n📋 Sample User:', firstUser);
        }

        // Show first company if exists
        if (counts.companies > 0) {
            const firstCompany = await prisma.company.findFirst({
                select: { id: true, name: true }
            });
            console.log('📋 Sample Company:', firstCompany);
        }

    } catch (error: any) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
