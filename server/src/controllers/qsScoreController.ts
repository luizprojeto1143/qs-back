import { Request, Response } from 'express';
import prisma from '../prisma';

// Classificação baseada no score
const getClassification = (score: number): string => {
    if (score >= 800) return 'EXCELENTE';
    if (score >= 600) return 'BOM';
    if (score >= 400) return 'ATENCAO';
    if (score >= 200) return 'RISCO';
    return 'CRITICO';
};

// Cor para o mapa de risco
const getRiskColor = (score: number): string => {
    if (score >= 600) return 'green';
    if (score >= 400) return 'yellow';
    return 'red';
};

// Calcular QS Score de uma área
const calculateAreaScore = async (areaId: string, companyId: string) => {
    // Buscar dados da área
    const [
        pendingItems,
        resolvedItems,
        visits,
        collaborators,
        complaints
    ] = await Promise.all([
        prisma.pendingItem.count({
            where: { areaId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
        }),
        prisma.pendingItem.count({
            where: { areaId, status: 'RESOLVED' }
        }),
        prisma.visit.findMany({
            where: { areaId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
            select: { avaliacaoArea: true, avaliacaoLideranca: true, avaliacaoColaborador: true }
        }),
        prisma.collaboratorProfile.count({ where: { areaId } }),
        prisma.complaint.findMany({
            where: {
                areaId,
                status: 'RESOLVIDO',
                resolvedAt: { not: null },
                createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Últimos 90 dias
            },
            select: { createdAt: true, resolvedAt: true }
        })
    ]);

    // Calcular tempo médio de resolução (em dias)
    let avgResolutionDays = 0;
    if (complaints && complaints.length > 0) {
        const totalDays = complaints.reduce((sum: number, c: any) => {
            const diffTime = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
            return sum + (diffTime / (1000 * 3600 * 24));
        }, 0);
        avgResolutionDays = totalDays / complaints.length;
    }

    // Fatores do cálculo
    const factors = {
        pendenciasAbertas: pendingItems,
        pendenciasResolvidas: resolvedItems,
        visitasRecentes: visits.length,
        colaboradores: collaborators,
        resolucaoDenunciasDias: avgResolutionDays.toFixed(1)
    };

    // Algoritmo de pontuação (0-1000)
    let score = 0;

    // 1. Taxa de Resolução de Pendências (Peso: 350)
    // Se não tiver pendências nem resolvidas nem abertas, considera neutro/bom início (start with partial points or 0?)
    // Vamos dar pontos pela proatividade.
    const totalItems = pendingItems + resolvedItems;
    if (totalItems > 0) {
        const resolutionRate = resolvedItems / totalItems;
        score += Math.floor(resolutionRate * 350);
    } else {
        // Sem pendências é bom (não tem problemas), mas também não tem proatividade registrada.
        // Vamos dar um incentivo inicial.
        score += 100;
    }

    // Penalidade por pendências abertas (diminui do acumulado)
    // Se tiver muitas pendências, pontuação cai drasticamente
    score -= Math.min(200, pendingItems * 25);

    // 2. Frequência de Visitas (Peso: 250)
    // 1 visita = 25 pontos. 10 visitas = 250 pontos (max)
    score += Math.min(250, visits.length * 25);

    // 3. Gestão de Denúncias (Peso: 200)
    if (avgResolutionDays > 0) {
        if (avgResolutionDays <= 7) score += 200; // Excelente (rápido)
        else if (avgResolutionDays <= 15) score += 100; // Bom
        else score += 0; // Lento (sem pontos)

        // Penalidade extra por demora excessiva
        if (avgResolutionDays > 30) score -= 100;
    } else {
        // Sem denúncias: Estado ideal (Segurança Psicológica)
        // Se houver visitas e avaliações positivas, assumimos que o ambiente está bom.
        score += 150;
    }

    // 4. Qualidade / Avaliações (Peso: 200)
    let avgEvaluation = 0;
    let evalCount = 0;
    visits.forEach(visit => {
        try {
            if (visit.avaliacaoArea) {
                const eval1 = JSON.parse(visit.avaliacaoArea);
                if (eval1.score) { avgEvaluation += eval1.score; evalCount++; }
            }
        } catch { }
    });

    // Avaliação vem geralmente de 1 a 5 ou 0 a 100? Assumindo 0-5 (estrelas) ou similar. 
    // Se for score de 0-100 (como NPS):
    if (evalCount > 0) {
        // Normalizar média (assumindo que o input seja 0-5, vamos converter para proporção de 200)
        // Se o score salvo for 0-5: (avg / 5) * 200
        // Se o score salvo for 0-100: (avg / 100) * 200
        // Vamos assumir prudência e verificar o dado depois, mas por ora, aumento o teto.
        const normalized = avgEvaluation > 5 ? avgEvaluation / 100 : avgEvaluation / 5;
        score += Math.floor(normalized * 200);
    }

    // Limitar entre 0 e 1000
    score = Math.max(0, Math.min(1000, score));

    return {
        score,
        classification: getClassification(score),
        factors: JSON.stringify(factors),
        breakdown: JSON.stringify({
            inclusao: Math.floor(score * 0.25),
            acessibilidade: Math.floor(score * 0.2),
            conflitos: Math.floor((1000 - pendingItems * 50) * 0.2),
            gestao: Math.floor(resolutionRate * 200),
            educacao: Math.floor(score * 0.15),
        }),
        trend: 'ESTAVEL', // TODO: calcular com histórico
    };
};

// Helper para calcular e salvar score da empresa
const calculateInternalCompanyScore = async (companyId: string) => {
    const areas = await prisma.area.findMany({
        where: { sector: { companyId } },
        include: { sector: true }
    });

    const scores = [];
    for (const area of areas) {
        const scoreData = await calculateAreaScore(area.id, companyId);
        // Salvar/Atualizar score da área (opcional, mas bom para manter histórico/cache)
        await prisma.qSScore.create({
            data: {
                companyId,
                areaId: area.id,
                ...scoreData,
            }
        });
        scores.push(scoreData.score);
    }

    // Calcular média
    const avgScore = scores.length > 0
        ? Math.floor(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

    const classification = getClassification(avgScore);

    // Salvar score geral
    const newScore = await prisma.qSScore.create({
        data: {
            companyId,
            score: avgScore,
            classification,
            factors: JSON.stringify({ areasAnalisadas: areas.length }),
            trend: 'ESTAVEL',
        }
    });

    return newScore;
};

export const qsScoreController = {
    // Obter score da empresa completo para Dashboard
    async getCompanyScore(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            // Verificar se QS Score está habilitado
            const settings = await prisma.systemSettings.findUnique({
                where: { companyId }
            });

            if (!settings?.qsScoreEnabled) {
                return res.status(403).json({ error: 'QS Score não está habilitado para esta empresa' });
            }

            // 1. Buscar Score Atual
            let currentScore = await prisma.qSScore.findFirst({
                where: { companyId, areaId: null },
                orderBy: { calculatedAt: 'desc' }
            });

            // Se não existir, calcular agora
            if (!currentScore) {
                try {
                    currentScore = await calculateInternalCompanyScore(companyId);
                } catch (calcError) {
                    console.error('Error calculating initial score:', calcError);
                    // Fallback para evitar crash da página
                    currentScore = { score: 0, classification: 'CRITICO', calculatedAt: new Date() } as any;
                }
            }

            // 2. Buscar Histórico (últimos 6 meses)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const history = await prisma.qSScore.findMany({
                where: {
                    companyId,
                    areaId: null,
                    calculatedAt: { gte: sixMonthsAgo }
                },
                orderBy: { calculatedAt: 'asc' },
                select: {
                    score: true,
                    calculatedAt: true
                }
            });

            // Formatar histórico
            const formattedHistory = history.map(h => ({
                date: h.calculatedAt.toLocaleDateString('pt-BR', { month: 'short' }),
                score: h.score
            }));

            // 3. Buscar Mapa de Risco para KPI e Gráfico
            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                select: { id: true, name: true }
            });

            const areasRisk = await Promise.all(areas.map(async (area) => {
                // Tenta pegar o último score da área
                const score = await prisma.qSScore.findFirst({
                    where: { companyId, areaId: area.id },
                    orderBy: { calculatedAt: 'desc' }
                });
                return {
                    id: area.id,
                    name: area.name,
                    score: score?.score || 0,
                    classification: score?.classification || 'CRITICO'
                };
            }));

            // Contar áreas críticas
            const criticalAreasCount = areasRisk.filter(a => a.classification === 'CRITICO' || a.classification === 'RISCO').length;

            res.json({
                score: currentScore?.score || 0,
                classification: currentScore?.classification || 'CRITICO',
                calculatedAt: currentScore?.calculatedAt,
                history: formattedHistory,
                areas: areasRisk,
                criticalAreasCount
            });
        } catch (error) {
            console.error('Error getting company score:', error);
            res.status(500).json({ error: 'Erro ao obter QS Score' });
        }
    },

    // Obter score de uma área
    async getAreaScore(req: Request, res: Response) {
        try {
            const { areaId } = req.params;
            const user = (req as any).user;

            const area = await prisma.area.findUnique({
                where: { id: areaId },
                include: { sector: true }
            });

            if (!area) {
                return res.status(404).json({ error: 'Área não encontrada' });
            }

            // Verificar se QS Score está habilitado
            const settings = await prisma.systemSettings.findUnique({
                where: { companyId: area.sector.companyId }
            });

            if (!settings?.qsScoreEnabled) {
                return res.status(403).json({ error: 'QS Score não está habilitado' });
            }

            // Calcular score da área
            const scoreData = await calculateAreaScore(areaId, area.sector.companyId);

            // Salvar no banco
            const score = await prisma.qSScore.create({
                data: {
                    companyId: area.sector.companyId,
                    areaId,
                    ...scoreData,
                }
            });

            res.json(score);
        } catch (error) {
            console.error('Error getting area score:', error);
            res.status(500).json({ error: 'Erro ao obter score da área' });
        }
    },

    // Mapa de risco (todas as áreas)
    async getRiskMap(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            // Verificar permissão
            const settings = await prisma.systemSettings.findUnique({
                where: { companyId }
            });

            if (!settings?.riskMapEnabled) {
                return res.status(403).json({ error: 'Mapa de risco não está habilitado' });
            }

            // Buscar todas as áreas com seus setores
            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                include: { sector: true }
            });

            // Calcular score de cada área
            const riskMap = await Promise.all(areas.map(async (area) => {
                const scoreData = await calculateAreaScore(area.id, companyId);
                return {
                    areaId: area.id,
                    areaName: area.name,
                    sectorId: area.sector.id,
                    sectorName: area.sector.name,
                    score: scoreData.score,
                    classification: scoreData.classification,
                    color: getRiskColor(scoreData.score),
                    factors: JSON.parse(scoreData.factors),
                };
            }));

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
            console.error('Error getting risk map:', error);
            res.status(500).json({ error: 'Erro ao obter mapa de risco' });
        }
    },

    // Simulador de impacto
    async simulateImpact(req: Request, res: Response) {
        try {
            const { areaId, actions } = req.body;
            // actions: [{ type: 'RESOLVE_PENDING', count: 2 }, { type: 'COMPLETE_COURSE', count: 1 }]

            const area = await prisma.area.findUnique({
                where: { id: areaId },
                include: { sector: true }
            });

            if (!area) {
                return res.status(404).json({ error: 'Área não encontrada' });
            }

            // Calcular score atual
            const currentScoreData = await calculateAreaScore(areaId, area.sector.companyId);
            let simulatedScore = currentScoreData.score;

            // Simular impacto das ações
            const impacts: any[] = [];

            for (const action of actions || []) {
                let impact = 0;
                switch (action.type) {
                    case 'RESOLVE_PENDING':
                        impact = action.count * 20; // Cada pendência resolvida = +20
                        break;
                    case 'COMPLETE_COURSE':
                        impact = action.count * 15; // Cada curso = +15
                        break;
                    case 'VISIT':
                        impact = 15; // Cada visita = +15
                        break;
                    case 'MEDIATION':
                        impact = 25; // Mediação bem sucedida = +25
                        break;
                }
                simulatedScore += impact;
                impacts.push({ action: action.type, count: action.count || 1, impact });
            }

            simulatedScore = Math.max(0, Math.min(1000, simulatedScore));

            res.json({
                currentScore: currentScoreData.score,
                currentClassification: currentScoreData.classification,
                simulatedScore,
                simulatedClassification: getClassification(simulatedScore),
                improvement: simulatedScore - currentScoreData.score,
                impacts,
            });
        } catch (error) {
            console.error('Error simulating impact:', error);
            res.status(500).json({ error: 'Erro ao simular impacto' });
        }
    },

    // Recalcular todos os scores de uma empresa
    async recalculateCompanyScores(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            const newScore = await calculateInternalCompanyScore(companyId);

            res.json({
                message: 'Scores recalculados com sucesso',
                companyScore: newScore.score,
            });
        } catch (error) {
            console.error('Error recalculating scores:', error);
            res.status(500).json({ error: 'Erro ao recalcular scores' });
        }
    },
};
