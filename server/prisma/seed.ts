import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Master User
    const hashedPassword = await bcrypt.hash('123456', 10);

    const master = await prisma.user.upsert({
        where: { email: 'master@qs.com' },
        update: {},
        create: {
            email: 'master@qs.com',
            name: 'Master QS',
            password: hashedPassword,
            role: 'MASTER'
        }
    });

    console.log({ master });

    // 2. Create a Demo Company
    const company = await prisma.company.upsert({
        where: { cnpj: '12.345.678/0001-90' },
        update: {},
        create: {
            name: 'Empresa Demo',
            cnpj: '12.345.678/0001-90',
            address: 'Rua Exemplo, 123',
            sectors: {
                create: [
                    {
                        name: 'Produção',
                        areas: {
                            create: [
                                { name: 'Linha A' },
                                { name: 'Linha B' }
                            ]
                        }
                    },
                    {
                        name: 'Administrativo',
                        areas: {
                            create: [
                                { name: 'RH' },
                                { name: 'Financeiro' }
                            ]
                        }
                    }
                ]
            }
        }
    });

    console.log({ company });

    // 3. Create an RH User for that company
    const rhUser = await prisma.user.upsert({
        where: { email: 'rh@empresa.com' },
        update: {},
        create: {
            email: 'rh@empresa.com',
            name: 'Maria RH',
            password: hashedPassword,
            role: 'RH',
            companyId: company.id
        }
    });

    console.log({ rhUser });

    // 4. Create a Collaborator
    // First get an area ID
    const area = await prisma.area.findFirst({ where: { sector: { companyId: company.id } } });

    if (area) {
        const collabUser = await prisma.user.upsert({
            where: { email: 'colab@empresa.com' },
            update: {},
            create: {
                email: 'colab@empresa.com',
                name: 'João Colaborador',
                password: hashedPassword,
                role: 'COLABORADOR',
                companyId: company.id,
                collaboratorProfile: {
                    create: {
                        matricula: '12345',
                        areaId: area.id,
                        shift: '1_TURNO',
                        disabilityType: 'FISICA'
                    }
                }
            }
        });
        console.log({ collabUser });
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
