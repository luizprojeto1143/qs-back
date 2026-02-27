
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createFull360Data() {
    try {
        const master = await prisma.user.findFirst({ where: { role: 'MASTER' } });
        if (!master) { console.log('Master not found'); return; };

        const cycle = await prisma.performanceCycle.findFirst({
            where: { companyId: master.companyId || undefined, status: 'ACTIVE' }
        });
        if (!cycle) { console.log('Cycle not found'); return; };

        console.log('Generating 360 Data for:', master.name);

        // --- 1. Manager Review ---
        let manager = await prisma.user.findFirst({ where: { email: 'manager.dummy@test.com' } });
        if (!manager) {
            manager = await prisma.user.create({
                data: {
                    name: 'Roberto Gestor (Fictício)',
                    email: 'manager.dummy@test.com',
                    password: 'hash',
                    role: 'LIDER',
                    companyId: master.companyId
                }
            });
        }

        const existingMgrReview = await prisma.performanceReview.findUnique({
            where: {
                cycleId_reviewerId_revieweeId: {
                    cycleId: cycle.id,
                    reviewerId: manager.id,
                    revieweeId: master.id
                }
            }
        });

        if (!existingMgrReview) {
            const mgrReview = await prisma.performanceReview.create({
                data: {
                    cycleId: cycle.id,
                    reviewerId: manager.id,
                    revieweeId: master.id,
                    type: 'MANAGER',
                    status: 'SUBMITTED'
                }
            });

            await prisma.reviewAnswer.create({
                data: { reviewId: mgrReview.id, competency: 'Comunicação', rating: 5, comment: 'Excelente' }
            } as any);
            await prisma.reviewAnswer.create({
                data: { reviewId: mgrReview.id, competency: 'Proatividade', rating: 4, comment: 'Muito bom' }
            } as any);
            await prisma.reviewAnswer.create({
                data: { reviewId: mgrReview.id, competency: 'Trabalho em Equipe', rating: 5, comment: '' }
            } as any);
            await prisma.reviewAnswer.create({
                data: { reviewId: mgrReview.id, competency: 'Entrega de Resultados', rating: 5, comment: '' }
            } as any);
            await prisma.reviewAnswer.create({
                data: { reviewId: mgrReview.id, competency: 'Inovação e Melhoria', rating: 4, comment: '' }
            } as any);
            console.log('✅ Avaliação do Gestor criada.');
        } else {
            console.log('ℹ️ Avaliação do Gestor já existe.');
        }

        // --- 2. Peer Review ---
        let peer = await prisma.user.findFirst({ where: { email: 'peer.dummy@test.com' } });
        if (!peer) {
            peer = await prisma.user.create({
                data: {
                    name: 'Carla Pares (Fictícia)',
                    email: 'peer.dummy@test.com',
                    password: 'hash',
                    role: 'COLABORADOR',
                    companyId: master.companyId
                }
            });
        }

        const existingPeerReview = await prisma.performanceReview.findUnique({
            where: {
                cycleId_reviewerId_revieweeId: {
                    cycleId: cycle.id,
                    reviewerId: peer.id,
                    revieweeId: master.id
                }
            }
        });

        if (!existingPeerReview) {
            const peerReview = await prisma.performanceReview.create({
                data: {
                    cycleId: cycle.id,
                    reviewerId: peer.id,
                    revieweeId: master.id,
                    type: 'PEER',
                    status: 'SUBMITTED'
                }
            });

            await prisma.reviewAnswer.create({ data: { reviewId: peerReview.id, competency: 'Comunicação', rating: 3, comment: '' } } as any);
            await prisma.reviewAnswer.create({ data: { reviewId: peerReview.id, competency: 'Proatividade', rating: 4, comment: '' } } as any);
            await prisma.reviewAnswer.create({ data: { reviewId: peerReview.id, competency: 'Trabalho em Equipe', rating: 3, comment: '' } } as any);
            await prisma.reviewAnswer.create({ data: { reviewId: peerReview.id, competency: 'Entrega de Resultados', rating: 4, comment: '' } } as any);
            await prisma.reviewAnswer.create({ data: { reviewId: peerReview.id, competency: 'Inovação e Melhoria', rating: 3, comment: '' } } as any);
            console.log('✅ Avaliação de Pares criada.');
        } else {
            console.log('ℹ️ Avaliação de Pares já existe.');
        }

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await prisma.$disconnect();
    }
}

createFull360Data();
