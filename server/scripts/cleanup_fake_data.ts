
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CLEANING UP FAKE DATA ---');

    // 1. Find Target Company (Tupy-Betim)
    const company = await prisma.company.findFirst({
        where: { name: { contains: 'Tupy' } }
    });

    if (!company) {
        console.log('Company Tupy not found, nothing to clean.');
        return;
    }
    console.log(`Target Company: ${company.name} (${company.id})`);

    // 2. Remove Fake Visit
    const deletedVisits = await prisma.visit.deleteMany({
        where: {
            companyId: company.id,
            observacoesMaster: 'Visita de teste gerada automaticamente.'
        }
    });
    console.log(`Deleted Visits: ${deletedVisits.count}`);

    // 3. Remove Fake Certificate
    const deletedCerts = await prisma.certificate.deleteMany({
        where: {
            code: { startsWith: 'CERT-SEED-' }
        }
    });
    console.log(`Deleted Certificates: ${deletedCerts.count}`);

    // 4. Find the Fake Course
    const course = await prisma.course.findFirst({
        where: {
            companyId: company.id,
            title: 'Curso de Inclusão Básica'
        }
    });

    if (course) {
        // 5. Remove Enrollments for this course
        const deletedEnrollments = await prisma.enrollment.deleteMany({
            where: { courseId: course.id }
        });
        console.log(`Deleted Enrollments: ${deletedEnrollments.count}`);

        // 6. Remove Lesson Progress
        // Need to find lessons first
        const modules = await prisma.module.findMany({ where: { courseId: course.id } });
        for (const mod of modules) {
            const lessons = await prisma.lesson.findMany({ where: { moduleId: mod.id } });
            for (const lesson of lessons) {
                await prisma.lessonProgress.deleteMany({ where: { lessonId: lesson.id } });
            }
        }
        console.log('Deleted Lesson Progress');

        // 7. Remove the Course (Cascades to modules/lessons usually, but let's be safe)
        // Prisma schema might have cascade delete, let's try deleting course
        await prisma.course.delete({
            where: { id: course.id }
        });
        console.log(`Deleted Course: ${course.title}`);
    } else {
        console.log('Fake course not found or already deleted.');
    }

    console.log('--- CLEANUP COMPLETED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
