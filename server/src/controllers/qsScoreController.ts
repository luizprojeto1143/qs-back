import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';
import { qsScoreService } from '../services/qsScoreService';

interface SimulationAction {
    type: string;
    count?: number;
}

interface ImpactResult {
    action: string;
    count: number;
    impact: number;
}

export const qsScoreController = {
    // Obter score da empresa completo para Dashboard
    async getCompanyScore(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            // Verificar se QS Score está habilitado
            const settings = await prisma.systemSettings.findUnique({ where: { companyId } });
            if (settings && settings.qsScoreEnabled === false) return res.status(403).json({ error: 'QS Score não está habilitado' });

            // 1. Buscar Score Atual ou Recalcular
            let currentScore = await prisma.qSScore.findFirst({
                where: { companyId, areaId: null },
                orderBy: { calculatedAt: 'desc' }
            });

            if (!currentScore) {
                await qsScoreService.performRecalculation(companyId);
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
            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                select: { id: true, name: true }
            });

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

            const areasRisk = areas.map((area: any) => {
                const score = latestScoreMap.get(area.id);
                return {
                    id: area.id,
                    name: area.name,
                    score: score?.score || 0,
                    classification: score?.classification || 'CRITICO'
                };
            });

            const criticalAreasCount = areasRisk.filter((a: any) => a.classification === 'CRITICO' || a.classification === 'RISCO').length;

            res.json({
                score: currentScore?.score || 0,
                classification: currentScore?.classification || 'CRITICO',
                calculatedAt: currentScore?.calculatedAt,
                history: history.map((h: any) => ({ date: h.calculatedAt.toLocaleDateString('pt-BR', { month: 'short' }), score: h.score })),
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
            const data = await qsScoreService.fetchAreaData(areaId);
            const scoreResult = qsScoreService.computeScore(data);

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
            const settings = await prisma.systemSettings.findUnique({ where: { companyId } });
            if (settings && settings.riskMapEnabled === false) return res.status(403).json({ error: 'Mapa de risco não está habilitado' });

            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                include: { sector: true }
            });

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

            const riskMap = areas.map((area: any) => {
                const score = latestScoreMap.get(area.id);

                return {
                    areaId: area.id,
                    areaName: area.name,
                    sectorId: area.sector.id,
                    sectorName: area.sector.name,
                    score: score?.score || 0,
                    classification: score?.classification || 'CRITICO',
                    color: qsScoreService.getRiskColor(score?.score || 0),
                    factors: score?.factors || {},
                };
            });

            res.json({
                companyId,
                calculatedAt: new Date(),
                areas: riskMap,
                summary: {
                    total: riskMap.length,
                    green: riskMap.filter((a: any) => a.color === 'green').length,
                    yellow: riskMap.filter((a: any) => a.color === 'yellow').length,
                    red: riskMap.filter((a: any) => a.color === 'red').length,
                    avgScore: Math.floor(riskMap.reduce((sum: number, a: any) => sum + a.score, 0) / Math.max(1, riskMap.length)),
                }
            });

        } catch (error) {
            sendError500(res, ERROR_CODES.QS_RISK, error);
        }
    },

    async recalculateCompanyScores(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            await qsScoreService.performRecalculation(companyId);
            res.json({ message: 'Scores recalculados com sucesso' });
        } catch (error) {
            sendError500(res, ERROR_CODES.QS_RECALC, error);
        }
    },

    async simulateImpact(req: Request, res: Response) {
        try {
            const { areaId, actions } = req.body;
            const area = await prisma.area.findUnique({ where: { id: areaId }, include: { sector: true } });
            if (!area) return res.status(404).json({ error: 'Área não encontrada' });

            // Fetch REAL data
            const data = await qsScoreService.fetchAreaData(areaId);
            const currentResult = qsScoreService.computeScore(data);
            let simulatedScore = currentResult.score;

            const impacts: ImpactResult[] = [];
            for (const action of (actions as SimulationAction[]) || []) {
                let impact = 0;
                let count = action.count || 1;
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
                simulatedClassification: qsScoreService.getClassification(simulatedScore),
                improvement: simulatedScore - currentResult.score,
                impacts
            });

        } catch (error) {
            sendError500(res, ERROR_CODES.QS_SIMULATE, error);
        }
    }
};
