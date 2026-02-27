import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// --- Métodos Individuais ---

export const analyzePatterns = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        // 1. Coleta dados reais do banco
        const [complaints, collaborators, areas, latestScore] = await Promise.all([
            prisma.complaint.findMany({
                where: { companyId },
                select: { type: true, status: true, confidentiality: true }
            }),
            prisma.user.count({
                where: { companyId, role: 'COLABORADOR' }
            }),
            prisma.area.findMany({
                where: { sector: { companyId } },
                select: { name: true }
            }),
            prisma.qSScore.findFirst({
                where: { companyId },
                orderBy: { calculatedAt: 'desc' }
            })
        ]);

        // Dados compilados para a IA
        const analysisData = {
            totalCollaborators: collaborators,
            totalComplaints: complaints.length,
            complaintsByType: complaints.reduce((acc: Record<string, number>, curr: any) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1;
                return acc;
            }, {}),
            areasCount: areas.length,
            currentScore: latestScore?.score || 0
        };

        // 2. Chama o serviço de IA
        const analysisResult = await aiService.analyzeInclusionData(analysisData);

        res.json({
            timestamp: new Date(),
            data: analysisData,
            ai: analysisResult
        });

    } catch (error) {
        sendError500(res, ERROR_CODES.AI_ANALYZE, error);
    }
};

export const getSmartAlerts = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        const { status, severity } = req.query;

        const where: any = { companyId };
        if (status) where.status = status as string;
        if (severity) where.severity = severity as string;

        const alerts = await prisma.smartAlert.findMany({
            where,
            include: { area: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json(alerts);
    } catch (error) {
        sendError500(res, ERROR_CODES.AI_ALERTS, error);
    }
};

// --- Objeto Exportado para Rotas QS Inclusion ---

export const aiController = {
    analyzePatterns,

    analyzeArea: async (req: Request, res: Response) => {
        try {
            const { areaId } = req.params;

            // Buscar dados da área para análise
            const [area, complaints, pendingItems] = await Promise.all([
                prisma.area.findUnique({ where: { id: areaId }, include: { sector: true } }),
                prisma.complaint.count({ where: { areaId } }),
                prisma.pendingItem.count({ where: { areaId, status: 'PENDENTE' } })
            ]);

            if (!area) return res.status(404).json({ error: 'Área não encontrada' });

            // Análise simplificada via AI Service
            const result = await aiService.analyzePatterns({
                companyId: area.sector.companyId,
                areaName: area.name,
                data: {
                    pendingItems,
                    resolvedItems: 0, // Placeholder
                    visits: 0, // Placeholder
                    complaints,
                    averageResolutionDays: 0,
                    lastVisitDays: 0,
                    recentConflicts: []
                }
            });

            res.json(result);
        } catch (error) {
            sendError500(res, ERROR_CODES.AI_ANALYZE, error);
        }
    },

    getAlerts: getSmartAlerts,

    validateAlert: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;

            const alert = await prisma.smartAlert.update({
                where: { id },
                data: {
                    status: 'VALIDADO',
                    validatedAt: new Date(),
                    validatedById: user?.userId
                }
            });

            res.json(alert);
        } catch (error) {
            sendError500(res, ERROR_CODES.AI_ALERTS, error);
        }
    },

    sendAlertToRH: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { rhNotes } = req.body;

            const alert = await prisma.smartAlert.update({
                where: { id },
                data: {
                    status: 'ENVIADO_RH',
                    sentToRHAt: new Date(),
                    rhNotes
                }
            });

            res.json(alert);
        } catch (error) {
            sendError500(res, ERROR_CODES.AI_ALERTS, error);
        }
    },

    getPriorities: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;

            // Buscar áreas com scores baixos ou muitas denúncias
            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                include: {
                    _count: {
                        select: { complaints: true, pendingItems: true }
                    },
                    qsScores: {
                        orderBy: { calculatedAt: 'desc' },
                        take: 1
                    }
                }
            });

            const areasData = areas.map(a => ({
                name: a.name,
                score: a.qsScores[0]?.score || 0,
                complaints: a._count.complaints,
                pendingItems: a._count.pendingItems,
                lastVisitDays: 0 // Placeholder
            }));

            const priorities = await aiService.generatePriorities(areasData);
            res.json(priorities);
        } catch (error) {
            sendError500(res, ERROR_CODES.AI_ALERTS, error);
        }
    },

    getExecutiveSummary: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;

            const [score, areasCount, collaboratorsCount, pendingItems, openComplaints] = await Promise.all([
                prisma.qSScore.findFirst({ where: { companyId }, orderBy: { calculatedAt: 'desc' } }),
                prisma.area.count({ where: { sector: { companyId } } }),
                prisma.user.count({ where: { companyId, role: 'COLABORADOR' } }),
                prisma.pendingItem.count({ where: { companyId, status: 'PENDENTE' } }),
                prisma.complaint.count({ where: { companyId, status: { not: 'RESOLVIDO' } } })
            ]);

            const summaryText = await aiService.generateExecutiveSummary({
                score: score?.score || 0,
                areasCount,
                collaboratorsCount,
                pendingItems,
                openComplaints,
                lastVisitDate: 'N/A'
            });

            res.json({
                companyId,
                summary: summaryText,
                sentiment: (score?.score || 0) > 700 ? "POSITIVO" : "ATENÇÃO"
            });
        } catch (error) {
            sendError500(res, ERROR_CODES.AI_ALERTS, error);
        }
    }
};
