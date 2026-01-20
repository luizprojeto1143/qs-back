import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

interface SimulationAction {
    type: string;
    count?: number;
}

interface ImpactResult {
    action: string;
    count: number;
    impact: number;
}

// Data structure required for score calculation
interface AreaScoreInput {
    pendingItemsCount: number;
    resolvedItemsCount: number;
    visits: any[]; // Using any[] for simplicity as partial Visit objects
    collaboratorsCount: number;
    resolvedComplaints: { createdAt: Date, resolvedAt: Date | null }[];
    totalComplaintsCount: number;
    leadershipPendingItemsCount: number;
    latestComplaintDate: Date | null;
}

// Classificação baseada no score
const getClassification = (score: number): string => {
    if (score >= 800) return 'EXCELENTE';
    if (score >= 600) return 'BOM';
    if (score >= 400) return 'ATENCAO';
    if (score >= 200) return 'RISCO';
    return 'CRITICO';
};

// Score calculation constants
const SCORE_WEIGHTS = {
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

const SCORE_THRESHOLDS = {
    EXCELLENT: 800,
    GOOD: 600,
    ATTENTION: 400,
    RISK: 200
};

// Cor para o mapa de risco
const getRiskColor = (score: number): string => {
    if (score >= SCORE_THRESHOLDS.GOOD) return 'green';
    if (score >= SCORE_THRESHOLDS.ATTENTION) return 'yellow';
    return 'red';
};

// --- PURE CALCULATION LOGIC ---
const computeScore = (data: AreaScoreInput) => {
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
            // Reconstruct logic for backward compatibility
            if (visit.evaluations) {
                // We need to simulate the structure { score: number } or the criteria map
                // Looking at previous logic: `if (eval1.score)...`
                // But wait, the previous JSON structure was variable.
                // If the new evaluations table stores `rating`, we can average them?
                // Or we check if there's a criteria named 'score'?
                // Let's assume average of all criteria ratings for 'AREA' type?
                // Or check if criteria is 'Geral' or strictly 'score'.
                // Let's iterate and find average.

                const areaEvals = visit.evaluations.filter((e: any) => e.type === 'AREA');
                if (areaEvals.length > 0) {
                    const total = areaEvals.reduce((sum: number, e: any) => sum + e.rating, 0);
                    avgEvaluation += (total / areaEvals.length);
                    evalCount++;
                }
            }
        } catch { }
    });

    if (evalCount > 0) {
        const normalized = avgEvaluation > 5 ? avgEvaluation / 100 : avgEvaluation / 5;
        score += Math.floor(normalized * 200);
        if (normalized < 0.5) score -= 100;
    }

    score = Math.max(0, Math.min(1000, score));

    return {
        score,
        classification: getClassification(score),
        factors: JSON.stringify({
            pendenciasAbertas: pendingItemsCount,
            pendenciasLideranca: leadershipPendingItemsCount,
            pendenciasResolvidas: resolvedItemsCount,
            visitasRecentes: visits.length,
            colaboradores: collaboratorsCount,
            resolucaoDenunciasDias: avgResolutionDays.toFixed(1),
            totalDenuncias: totalComplaintsCount,
            ultimaDenuncia: latestComplaintDate
        }),
        breakdown: JSON.stringify({
            inclusao: Math.floor(score * 0.25),
            acessibilidade: Math.floor(score * 0.2),
            conflitos: Math.floor((1000 - pendingItemsCount * 50) * 0.2),
            gestao: Math.floor(resolutionRate * 200),
            educacao: Math.floor(score * 0.15),
        }),
        trend: 'ESTAVEL'
    };
};

// --- DATA FETCHING ---

// Fetch data for a single area
const fetchAreaData = async (areaId: string): Promise<AreaScoreInput> => {
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
};

export const qsScoreController = {
    // Obter score da empresa completo para Dashboard
    async getCompanyScore(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            // Verificar se QS Score está habilitado
            const settings = await prisma.systemSettings.findUnique({ where: { companyId } });
            // MODIFIED: Only block if explicitly disabled
            if (settings && settings.qsScoreEnabled === false) return res.status(403).json({ error: 'QS Score não está habilitado' });

            // 1. Buscar Score Atual ou Recalcular
            let currentScore = await prisma.qSScore.findFirst({
                where: { companyId, areaId: null },
                orderBy: { calculatedAt: 'desc' }
            });

            if (!currentScore) {
                // Calculation Logic (Inline for Company Level aggregation)
                // Re-using recalculate logic
                await qsScoreController.performRecalculation(companyId);
                currentScore = await prisma.qSScore.findFirst({
                    where: { companyId, areaId: null },
                    orderBy: { calculatedAt: 'desc' }
                });
            }

            // 2. Histórico
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const history = await prisma.qSScore.findMany({
                where: { companyId, areaId: null, calculatedAt: { gte: sixMonthsAgo } },
                orderBy: { calculatedAt: 'asc' },
                select: { score: true, calculatedAt: true }
            });

            // 3. Mapa de Risco Resumido (Do banco, muito mais rápido)
            // Pegar o último score de cada área
            // Otimização: Pegar apenas os scores mais recentes de cada areaId usando distinct ou groupBy se possível,
            // ou buscar raw. Prisma não tem "distinct on" fácil com orderBy.
            // Vamos buscar todas as areas e depois buscar os scores, mas cuidado com N+1 aqui se não tiver cache.
            // Melhor: Buscar scores onde companyId = X e areaId != null, order desc.
            // Mas precisamos apenas o ÚLTIMO de cada área.
            // Abordagem: Buscar areas, e para cada área buscar score no cache (tabela qSScore).
            // A tabela qSScore serve como cache historico.

            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                select: { id: true, name: true }
            });

            // Bulk fetch latest scores for these areas?
            // Select * from QSScore where companyId = ... AND areaId IN (...)
            // Hard to filter "latest" in pure Prisma efficiently without raw query.
            // Fallback: Promise.all simples (ainda N queries mas leve pois é select simples na tabela de score indexada)

            // OTIMIZAÇÃO: Buscar todos os scores recentes da empresa de uma vez
            const allScores = await prisma.qSScore.findMany({
                where: { companyId, areaId: { not: null } },
                orderBy: { calculatedAt: 'desc' },
                // Precisamos de histórico para pegar o mais recente? 
                // Se pegarmos todos, podemos filtrar em memória. 
                // Infelizmente não dá pra fazer "distinct on" nativo facilmente aqui.
                // Limitando a busca para não pegar histórico infinito?
                // Vamos pegar os últimos 30 dias de calculo ou limitar 1000 records.
                take: 1000
            });

            // Criar Map: AreaId -> Score mais recente
            const latestScoreMap = new Map();
            for (const s of allScores) {
                if (s.areaId && !latestScoreMap.has(s.areaId)) {
                    latestScoreMap.set(s.areaId, s);
                }
            }

            const areasRisk = areas.map(area => {
                const score = latestScoreMap.get(area.id);
                return {
                    id: area.id,
                    name: area.name,
                    score: score?.score || 0,
                    classification: score?.classification || 'CRITICO'
                };
            });

            const criticalAreasCount = areasRisk.filter(a => a.classification === 'CRITICO' || a.classification === 'RISCO').length;

            res.json({
                score: currentScore?.score || 0,
                classification: currentScore?.classification || 'CRITICO',
                calculatedAt: currentScore?.calculatedAt,
                history: history.map(h => ({ date: h.calculatedAt.toLocaleDateString('pt-BR', { month: 'short' }), score: h.score })),
                areas: areasRisk,
                criticalAreasCount
            });

        } catch (error) {
            sendError500(res, ERROR_CODES.QS_GET, error);
        }
    },

    async getAreaScore(req: Request, res: Response) {
        try {
            const { areaId } = req.params;
            const user = (req as AuthRequest).user;
            if (!user) return res.status(401).json({ error: 'Não autenticado' });

            const area = await prisma.area.findUnique({ where: { id: areaId }, include: { sector: true } });
            if (!area) return res.status(404).json({ error: 'Área não encontrada' });

            // Calculate fresh
            const data = await fetchAreaData(areaId);
            const scoreResult = computeScore(data);

            // Save
            const score = await prisma.qSScore.create({
                data: {
                    companyId: area.sector.companyId,
                    areaId,
                    ...scoreResult
                }
            });

            res.json(score);
        } catch (error) {
            sendError500(res, ERROR_CODES.QS_AREA, error);
        }
    },

    async getRiskMap(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            // Validar se feature enabled
            const settings = await prisma.systemSettings.findUnique({ where: { companyId } });
            // MODIFIED: Only block if explicitly disabled
            if (settings && settings.riskMapEnabled === false) return res.status(403).json({ error: 'Mapa de risco não está habilitado' });

            // Re-use logic: fetch latest scores from DB (fast) instead of recalculating (slow)
            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                include: { sector: true }
            });

            // Para o mapa de risco detalhado, se quisermos realtime, teríamos que recalcular.
            // Mas vamos assumir que o "Recalculate" é a ação para atualizar.
            // Aqui buscamos o cache do banco.
            // OTIMIZAÇÃO: Buscar todos os scores em lote
            const allScores = await prisma.qSScore.findMany({
                where: { companyId, areaId: { not: null } },
                orderBy: { calculatedAt: 'desc' },
                take: 1000
            });

            const latestScoreMap = new Map();
            for (const s of allScores) {
                if (s.areaId && !latestScoreMap.has(s.areaId)) {
                    latestScoreMap.set(s.areaId, s);
                }
            }

            const riskMap = areas.map(area => {
                const score = latestScoreMap.get(area.id);

                return {
                    areaId: area.id,
                    areaName: area.name,
                    sectorId: area.sector.id,
                    sectorName: area.sector.name,
                    score: score?.score || 0,
                    classification: score?.classification || 'CRITICO',
                    color: getRiskColor(score?.score || 0),
                    factors: score?.factors ? JSON.parse(score.factors) : {},
                };
            });

            res.json({
                companyId,
                calculatedAt: new Date(),
                areas: riskMap,
                summary: {
                    total: riskMap.length,
                    green: riskMap.filter(a => a.color === 'green').length,
                    yellow: riskMap.filter(a => a.color === 'yellow').length,
                    red: riskMap.filter(a => a.color === 'red').length,
                    avgScore: Math.floor(riskMap.reduce((sum, a) => sum + a.score, 0) / Math.max(1, riskMap.length)),
                }
            });

        } catch (error) {
            sendError500(res, ERROR_CODES.QS_RISK, error);
        }
    },

    // Ação explícita de recálculo (Bulk Optimization here!)
    async recalculateCompanyScores(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            await qsScoreController.performRecalculation(companyId);
            res.json({ message: 'Scores recalculados com sucesso' });
        } catch (error) {
            sendError500(res, ERROR_CODES.QS_RECALC, error);
        }
    },

    // INTERNAL HELPER: BULK RECALCULATION
    async performRecalculation(companyId: string) {
        // 1. Fetch ALL areas
        const areas = await prisma.area.findMany({
            where: { sector: { companyId } },
            select: { id: true }
        });
        const areaIds = areas.map(a => a.id);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        // 2. Fetch Aggregated Data (Bulk) using Promise.all
        // Prisma GroupBy is perfect here
        const [
            pendingCounts,
            resolvedCounts,
            visits,
            collabCounts,
            complaints, // Need raw data for date diffs
            leadershipCounts
        ] = await Promise.all([
            // Pending Items Open
            prisma.pendingItem.groupBy({
                by: ['areaId'],
                where: { areaId: { in: areaIds }, status: 'PENDENTE' },
                _count: true
            }),
            // Pending Items Resolved
            prisma.pendingItem.groupBy({
                by: ['areaId'],
                where: { areaId: { in: areaIds }, status: { in: ['RESOLVIDA', 'CONCLUIDA'] } },
                _count: true
            }),
            // Visits (Need raw for evaluations)
            prisma.visit.findMany({
                where: { areaId: { in: areaIds }, createdAt: { gte: ninetyDaysAgo } },
                select: { areaId: true, evaluations: true }
            }),
            // Collaborators
            prisma.collaboratorProfile.groupBy({
                by: ['areaId'],
                where: { areaId: { in: areaIds } },
                _count: true
            }),
            // Complaints (Need raw for dates)
            prisma.complaint.findMany({
                where: { areaId: { in: areaIds } }, // Fetch all history for "latest", or restrict?
                select: { areaId: true, status: true, resolvedAt: true, createdAt: true }
            }),
            // Leadership Pending Items
            prisma.pendingItem.count({
                where: {
                    areaId: { in: areaIds },
                    status: 'PENDENTE',
                    responsible: { contains: 'Lider', mode: 'insensitive' }
                }
            }) as any // Fallback to fetching raw if groupBy is limited on contains
        ]);

        // Fix for Leadership Pending Bulk: Fetch raw minimal
        const leadershipItems = await prisma.pendingItem.findMany({
            where: {
                areaId: { in: areaIds },
                status: 'PENDENTE',
                responsible: { contains: 'Lider', mode: 'insensitive' }
            },
            select: { areaId: true }
        });

        // Map Data
        const scoresToCreate = [];
        let totalScoreSum = 0;

        for (const area of areas) {
            const areaId = area.id;

            // Map pending
            const pOpen = pendingCounts.find(p => p.areaId === areaId)?._count || 0;
            const pResolved = resolvedCounts.find(p => p.areaId === areaId)?._count || 0;
            const leadCount = leadershipItems.filter(i => i.areaId === areaId).length;
            const cCount = collabCounts.find(c => c.areaId === areaId)?._count || 0;

            const areaVisits = visits.filter(v => v.areaId === areaId);
            const areaComplaints = complaints.filter(c => c.areaId === areaId);

            // Correct format for complaints
            const resolvedComplaints = areaComplaints
                .filter(c => c.status === 'RESOLVIDO' && c.resolvedAt && new Date(c.createdAt) >= ninetyDaysAgo)
                .map(c => ({ createdAt: c.createdAt, resolvedAt: c.resolvedAt }));

            const totalComplaintsIn90 = areaComplaints.filter(c => new Date(c.createdAt) >= ninetyDaysAgo).length;

            // Latest complaint
            const latestC = areaComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

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

            const result = computeScore(input);
            scoresToCreate.push({
                companyId,
                areaId,
                ...result
            });
            totalScoreSum += result.score;
        }

        // Bulk Insert/Update (Prisma doesn't support createMany with different data easily without loop, 
        // but explicit creates in loop is faster than calc + query)
        // Or Promise.all the creates
        await Promise.all(scoresToCreate.map(data => prisma.qSScore.create({ data })));

        // Create Company Aggregate
        const avgScore = areas.length > 0 ? Math.floor(totalScoreSum / areas.length) : 0;
        await prisma.qSScore.create({
            data: {
                companyId,
                score: avgScore,
                classification: getClassification(avgScore),
                factors: JSON.stringify({ areasAnalisadas: areas.length }),
                trend: 'ESTAVEL'
            }
        });
    },

    async simulateImpact(req: Request, res: Response) {
        try {
            const { areaId, actions } = req.body;
            const area = await prisma.area.findUnique({ where: { id: areaId }, include: { sector: true } });
            if (!area) return res.status(404).json({ error: 'Área não encontrada' });

            // Fetch REAL data
            const data = await fetchAreaData(areaId);
            const currentResult = computeScore(data);
            let simulatedScore = currentResult.score;

            // Apply simulation
            // ... (keep existing simple simulation logic or enhance)
            const impacts: ImpactResult[] = [];
            for (const action of actions || []) {
                let impact = 0;
                let count = action.count || 1;
                // Simple static impacts for simulation
                switch (action.type) {
                    case 'RESOLVE_PENDING': impact = count * 20; break;
                    case 'COMPLETE_COURSE': impact = count * 15; break;
                    case 'VISIT': impact = 15; break;
                    case 'MEDIATION': impact = 25; break;
                }
                simulatedScore += impact;
                impacts.push({ action: action.type, count, impact });
            }
            simulatedScore = Math.max(0, Math.min(1000, simulatedScore));

            res.json({
                currentScore: currentResult.score,
                currentClassification: currentResult.classification,
                simulatedScore,
                simulatedClassification: getClassification(simulatedScore),
                improvement: simulatedScore - currentResult.score,
                impacts
            });

        } catch (error) {
            sendError500(res, ERROR_CODES.QS_SIMULATE, error);
        }
    }
};
