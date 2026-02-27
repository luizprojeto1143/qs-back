import prisma from '../prisma';

export interface AreaScoreInput {
    pendingItemsCount: number;
    resolvedItemsCount: number;
    visits: any[];
    collaboratorsCount: number;
    resolvedComplaints: { createdAt: Date, resolvedAt: Date | null }[];
    totalComplaintsCount: number;
    leadershipPendingItemsCount: number;
    latestComplaintDate: Date | null;
}

export interface ScoreResult {
    score: number;
    classification: string;
    factors: any;
    breakdown: any;
    trend: string;
}

// Score calculation constants
export const SCORE_WEIGHTS = {
    RESOLUTION_RATE: 350,
    VISIT_FREQUENCY: 250,
    EVALUATION_QUALITY: 200,
    CLEAN_AREA_BONUS: 50,
    LOW_RESOLUTION_PENALTY: 100,
    NO_VISITS_PENALTY: 200,
    PENDING_ITEM_PENALTY: 50,
    PENDING_ITEM_MAX_PENALTY: 500,
    LEADERSHIP_PENDING_PENALTY: 30,
    LEADERSHIP_PENDING_MAX_PENALTY: 300,
    VISIT_SCORE_PER_VISIT: 25,
    WEEKS_SILENCE_PENALTY: 100,
    HIGH_COMPLAINTS_PENALTY: 100,
    SOME_COMPLAINTS_BONUS: 100,
    FAST_RESOLUTION_BONUS: 100, // <= 7 days
    MEDIUM_RESOLUTION_BONUS: 50, // <= 15 days
    SLOW_RESOLUTION_PENALTY: 100, // > 15 days
    VERY_SLOW_RESOLUTION_PENALTY: 300, // > 30 days
    LOW_EVAL_PENALTY: 100
};

export const SCORE_THRESHOLDS = {
    EXCELLENT: 800,
    GOOD: 600,
    ATTENTION: 400,
    RISK: 200
};

export const qsScoreService = {
    getClassification(score: number): string {
        if (score >= 800) return 'EXCELENTE';
        if (score >= 600) return 'BOM';
        if (score >= 400) return 'ATENCAO';
        if (score >= 200) return 'RISCO';
        return 'CRITICO';
    },

    getRiskColor(score: number): string {
        if (score >= SCORE_THRESHOLDS.GOOD) return 'green';
        if (score >= SCORE_THRESHOLDS.ATTENTION) return 'yellow';
        return 'red';
    },

    computeScore(data: AreaScoreInput): ScoreResult {
        const {
            pendingItemsCount,
            resolvedItemsCount,
            visits,
            collaboratorsCount,
            resolvedComplaints,
            totalComplaintsCount,
            leadershipPendingItemsCount,
            latestComplaintDate
        } = data;

        // Calcular tempo médio de resolução (em dias) SOMENTE para os resolvidos
        let avgResolutionDays = 0;
        if (resolvedComplaints && resolvedComplaints.length > 0) {
            const totalDays = resolvedComplaints.reduce((sum: number, c) => {
                if (!c.resolvedAt) return sum;
                const diffTime = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
                return sum + (diffTime / (1000 * 3600 * 24));
            }, 0);
            avgResolutionDays = totalDays / resolvedComplaints.length;
        }

        // Algoritmo de pontuação (0-1000)
        let score = 0;
        let resolutionRate = 0;

        // 1. Taxa de Resolução de Pendências (Peso: 350)
        const totalItems = pendingItemsCount + resolvedItemsCount;
        if (totalItems > 0) {
            resolutionRate = resolvedItemsCount / totalItems;
            score += Math.floor(resolutionRate * 350);

            // PENALIDADE: Se resolver menos de 40%, perde pontos (sinal de ineficiência)
            if (resolutionRate < 0.4) {
                score -= 100;
            }
        } else {
            score += 50; // Bonus por estar limpo (ou sem atividade, mas seguro)
            resolutionRate = 1;
        }

        // PENALIDADE PESADA: Pendências abertas
        score -= Math.min(500, pendingItemsCount * 50);

        // PENALIDADE EXTRA: Pendências da Liderança
        if (leadershipPendingItemsCount > 0) {
            score -= Math.min(300, leadershipPendingItemsCount * 30);
        }

        // 2. Frequência de Visitas (Peso: 250)
        score += Math.min(250, visits.length * 25);

        // PENALIDADE: Ausência de Visitas (Abandono)
        if (visits.length === 0) {
            score -= 200;
        }

        // 3. Gestão de Denúncias
        const now = new Date();
        let weeksSilence = 0;

        if (latestComplaintDate) {
            const diffTime = Math.abs(now.getTime() - new Date(latestComplaintDate).getTime());
            weeksSilence = Math.floor(diffTime / (1000 * 3600 * 24 * 7));
        } else {
            weeksSilence = 12; // Penalidade padrão se nunca houve
        }

        if (weeksSilence > 0) {
            score -= (weeksSilence * 100);
        }

        if (totalComplaintsCount > 5) {
            score -= 100;
        } else if (totalComplaintsCount > 0) {
            score += 100;
        }

        // Resolução (Velocidade)
        if (avgResolutionDays > 0) {
            if (avgResolutionDays <= 7) score += 100;
            else if (avgResolutionDays <= 15) score += 50;
            else score -= 100;

            if (avgResolutionDays > 30) score -= 300;
        }

        // 4. Qualidade / Avaliações (Peso: 200)
        let avgEvaluation = 0;
        let evalCount = 0;
        visits.forEach((visit: any) => {
            try {
                if (visit.evaluations) {
                    const areaEvals = visit.evaluations.filter((e: any) => e.type === 'AREA');
                    if (areaEvals.length > 0) {
                        const total = areaEvals.reduce((sum: number, e: any) => sum + e.rating, 0);
                        avgEvaluation += (total / areaEvals.length);
                        evalCount++;
                    }
                }
            } catch (e) {
                console.warn('[QSScoreService] Error processing visit evaluation:', e instanceof Error ? e.message : e);
            }
        });

        if (evalCount > 0) {
            const normalized = avgEvaluation > 5 ? avgEvaluation / 100 : avgEvaluation / 5;
            score += Math.floor(normalized * 200);
            if (normalized < 0.5) score -= 100;
        }

        score = Math.max(0, Math.min(1000, score));

        return {
            score,
            classification: this.getClassification(score),
            factors: {
                pendenciasAbertas: pendingItemsCount,
                pendenciasLideranca: leadershipPendingItemsCount,
                pendenciasResolvidas: resolvedItemsCount,
                visitasRecentes: visits.length,
                colaboradores: collaboratorsCount,
                resolucaoDenunciasDias: avgResolutionDays.toFixed(1),
                totalDenuncias: totalComplaintsCount,
                ultimaDenuncia: latestComplaintDate
            },
            breakdown: {
                inclusao: Math.floor(score * 0.25),
                acessibilidade: Math.floor(score * 0.2),
                conflitos: Math.floor((1000 - pendingItemsCount * 50) * 0.2),
                gestao: Math.floor(resolutionRate * 200),
                educacao: Math.floor(score * 0.15),
            },
            trend: 'ESTAVEL'
        };
    },

    async fetchAreaData(areaId: string): Promise<AreaScoreInput> {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const [
            pendingItemsCount,
            resolvedItemsCount,
            visits,
            collaboratorsCount,
            resolvedComplaints,
            totalComplaintsCount,
            leadershipPendingItemsCount,
            latestComplaint
        ] = await Promise.all([
            prisma.pendingItem.count({ where: { areaId, status: 'PENDENTE' } }),
            prisma.pendingItem.count({ where: { areaId, status: { in: ['RESOLVIDA', 'CONCLUIDA'] } } }),
            prisma.visit.findMany({
                where: { areaId, createdAt: { gte: ninetyDaysAgo } },
                select: { evaluations: true }
            }),
            prisma.collaboratorProfile.count({ where: { areaId } }),
            prisma.complaint.findMany({
                where: {
                    areaId,
                    status: 'RESOLVIDO',
                    resolvedAt: { not: null },
                    createdAt: { gte: ninetyDaysAgo }
                },
                select: { createdAt: true, resolvedAt: true }
            }),
            prisma.complaint.count({ where: { areaId, createdAt: { gte: ninetyDaysAgo } } }),
            prisma.pendingItem.count({
                where: {
                    areaId,
                    status: 'PENDENTE',
                    responsible: { contains: 'Lider', mode: 'insensitive' }
                }
            }),
            prisma.complaint.findFirst({
                where: { areaId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            })
        ]);

        return {
            pendingItemsCount,
            resolvedItemsCount,
            visits,
            collaboratorsCount,
            resolvedComplaints,
            totalComplaintsCount,
            leadershipPendingItemsCount,
            latestComplaintDate: latestComplaint?.createdAt || null
        };
    },

    async performRecalculation(companyId: string): Promise<void> {
        // 1. Fetch ALL areas
        const areas = await prisma.area.findMany({
            where: { sector: { companyId } },
            select: { id: true }
        });
        const areaIds = areas.map((a: any) => a.id);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        // 2. Fetch Aggregated Data (Bulk) using Promise.all
        const [
            pendingCounts,
            resolvedCounts,
            visits,
            collabCounts,
            complaints,
            leadershipItems
        ] = await Promise.all([
            prisma.pendingItem.groupBy({
                by: ['areaId'],
                where: { areaId: { in: areaIds }, status: 'PENDENTE' },
                _count: true
            }),
            prisma.pendingItem.groupBy({
                by: ['areaId'],
                where: { areaId: { in: areaIds }, status: { in: ['RESOLVIDA', 'CONCLUIDA'] } },
                _count: true
            }),
            prisma.visit.findMany({
                where: { areaId: { in: areaIds }, createdAt: { gte: ninetyDaysAgo } },
                select: { areaId: true, evaluations: true }
            }),
            prisma.collaboratorProfile.groupBy({
                by: ['areaId'],
                where: { areaId: { in: areaIds } },
                _count: true
            }),
            prisma.complaint.findMany({
                where: { areaId: { in: areaIds } },
                select: { areaId: true, status: true, resolvedAt: true, createdAt: true }
            }),
            prisma.pendingItem.findMany({
                where: {
                    areaId: { in: areaIds },
                    status: 'PENDENTE',
                    responsible: { contains: 'Lider', mode: 'insensitive' }
                },
                select: { areaId: true }
            })
        ]);

        // Map Data
        const scoresToCreate = [];
        let totalScoreSum = 0;

        for (const area of areas) {
            const areaId = area.id;

            const pOpen = pendingCounts.find((p: any) => p.areaId === areaId)?._count || 0;
            const pResolved = resolvedCounts.find((p: any) => p.areaId === areaId)?._count || 0;
            const leadCount = leadershipItems.filter((i: any) => i.areaId === areaId).length;
            const cCount = collabCounts.find((c: any) => c.areaId === areaId)?._count || 0;

            const areaVisits = visits.filter((v: any) => v.areaId === areaId);
            const areaComplaints = complaints.filter((c: any) => c.areaId === areaId);

            const resolvedComplaints = areaComplaints
                .filter((c: any) => c.status === 'RESOLVIDO' && c.resolvedAt && new Date(c.createdAt) >= ninetyDaysAgo)
                .map((c: any) => ({ createdAt: c.createdAt, resolvedAt: c.resolvedAt }));

            const totalComplaintsIn90 = areaComplaints.filter((c: any) => new Date(c.createdAt) >= ninetyDaysAgo).length;

            const latestC = areaComplaints.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            const input: AreaScoreInput = {
                pendingItemsCount: pOpen,
                resolvedItemsCount: pResolved,
                visits: areaVisits,
                collaboratorsCount: cCount,
                resolvedComplaints: resolvedComplaints,
                totalComplaintsCount: totalComplaintsIn90,
                leadershipPendingItemsCount: leadCount,
                latestComplaintDate: latestC?.createdAt || null
            };

            const result = this.computeScore(input);
            scoresToCreate.push({
                companyId,
                areaId,
                ...result
            });
            totalScoreSum += result.score;
        }

        // Bulk Insert
        await Promise.all(scoresToCreate.map(data => prisma.qSScore.create({ data })));

        // Create Company Aggregate
        const avgScore = areas.length > 0 ? Math.floor(totalScoreSum / areas.length) : 0;
        await prisma.qSScore.create({
            data: {
                companyId,
                score: avgScore,
                classification: this.getClassification(avgScore),
                factors: { areasAnalisadas: areas.length },
                trend: 'ESTAVEL'
            }
        });
    }
};
