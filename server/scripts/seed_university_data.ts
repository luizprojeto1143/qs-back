
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING UNIVERSITY DATA ---');

    // 1. Find Target Company (Tupy-Betim)
    const company = await prisma.company.findFirst({
        where: { name: { contains: 'Tupy' } }
    });

    if (!company) {
        console.error('Company Tupy not found');
        return;
    }
    console.log(`Target Company: ${company.name} (${company.id})`);

    // 2. Find or Create a Course
    let course = await prisma.course.findFirst({
        where: { active: true }
    });

    if (!course) {
        console.log('Creating demo course...');
        course = await prisma.course.create({
            data: {
                title: 'Curso de Inclusão Básica',
                description: 'Curso introdutório sobre inclusão.',
                duration: 60,
                category: 'Inclusão',
                companyId: company.id,
                modules: {
                    create: {
                        title: 'Módulo 1',
                        order: 1,
                        lessons: {
                            create: {
                                title: 'Aula 1',
                                description: 'Introdução',
                                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                duration: 10,
                                order: 1
                            }
                        }
                    }
                }
            }
        });
    }
    console.log(`Course: ${course.title} (${course.id})`);

    // 3. Find RH User to Enroll
    const user = await prisma.user.findFirst({
        where: { companyId: company.id, role: 'RH' }
    });

    if (!user) {
        console.error('No RH user found for this company');
        return;
    }
    console.log(`Target User: ${user.name} (${user.id})`);

    // 4. Enroll User
    console.log('Enrolling user...');
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: user.id,
                courseId: course.id
            }
        },
        update: {
            progress: 100,
            completed: true,
            completedAt: new Date()
        },
        create: {
            userId: user.id,
            courseId: course.id,
            progress: 100,
            completed: true,
            completedAt: new Date()
        }
    });

    // 5. Create Certificate
    console.log('Generating certificate...');
    await prisma.certificate.upsert({
        where: {
            code: `CERT-SEED-${user.id.substring(0, 4)}`
        },
        update: {},
        create: {
            userId: user.id,
            courseId: course.id,
            code: `CERT-SEED-${user.id.substring(0, 4)}`,
            issuedAt: new Date()
        }
    });

    // 6. Create a Visit (Acompanhamento)
    console.log('Creating a visit...');
    const masterUser = await prisma.user.findFirst({ where: { role: 'MASTER' } });

    if (masterUser) {
        await prisma.visit.create({
            data: {
                companyId: company.id,
                masterId: masterUser.id,
                date: new Date(),
                observacoesMaster: 'Visita de teste gerada automaticamente.',
                relatoLideranca: 'Tudo certo.',
                relatoColaborador: 'Sem queixas.'
            }
        });
        console.log('Visit created.');
    }

    console.log('--- SEED COMPLETED ---');
    console.log('Now the RH Dashboard should show 1 Completed Course and 1 Visit.');
    console.log('And the User should see 1 Certificate.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
