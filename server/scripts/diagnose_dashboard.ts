
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Check Users
    const users = await prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, role: true, companyId: true, email: true }
    });
    console.log(`Total Active Users: ${users.length}`);
    const rhUsers = users.filter(u => u.role === 'RH');
    console.log(`RH Users: ${rhUsers.length}`);
    rhUsers.forEach(u => console.log(` - RH: ${u.name} (${u.email}) - Company: ${u.companyId}`));

    // 2. Check Companies
    const companies = await prisma.company.findMany({ select: { id: true, name: true } });
    console.log(`Total Companies: ${companies.length}`);
    companies.forEach(c => console.log(` - Company: ${c.name} (${c.id})`));

    if (companies.length > 0) {
        const companyId = companies[0].id;
        console.log(`\n--- Checking Data for Company: ${companies[0].name} ---`);

        // 3. Check Enrollments
        const enrollments = await prisma.enrollment.count({
            where: { user: { companyId } }
        });
        console.log(`Total Enrollments: ${enrollments}`);

        const completedEnrollments = await prisma.enrollment.count({
            where: { user: { companyId }, completed: true }
        });
        console.log(`Completed Enrollments: ${completedEnrollments}`);

        // 4. Check Certificates
        const certificates = await prisma.certificate.count({
            where: { user: { companyId } }
        });
        console.log(`Total Certificates: ${certificates}`);

        // 5. Check Pending Items
        const pendencies = await prisma.pendingItem.count({
            where: { companyId }
        });
        console.log(`Total Pendencies: ${pendencies}`);
    }

    // 6. Check Specific User Certificates (if any user has them)
    const certs = await prisma.certificate.findMany({
        take: 5,
        include: { user: { select: { name: true, role: true } } }
    });
    console.log(`\n--- Sample Certificates ---`);
    if (certs.length === 0) console.log('No certificates found in DB.');
    certs.forEach(c => console.log(` - Cert for ${c.user.name} (${c.user.role})`));

    console.log('--- DIAGNOSTIC END ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
