import { Request, Response } from 'express';
import prisma from '../prisma';
import { aiService, PatternAnalysisInput } from '../services/aiService';

export const aiController = {
    // Analisar padrões de uma área
    async analyzeArea(req: Request, res: Response) {
        try {
            const { areaId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Apenas MASTER pode usar análise de IA' });
            }

            // Verificar se IA está habilitada
            const area = await prisma.area.findUnique({
                where: { id: areaId },
                include: { sector: true }
            });

            if (!area) {
                return res.status(404).json({ error: 'Área não encontrada' });
            }

            const settings = await prisma.systemSettings.findUnique({
                where: { companyId: area.sector.companyId }
            });

            if (!settings?.openAIEnabled) {
                return res.status(403).json({ error: 'IA não está habilitada para esta empresa' });
            }

            // Buscar dados da área
            const [pendingItems, resolvedItems, visits, complaints] = await Promise.all([
                prisma.pendingItem.count({
                    where: { areaId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
                }),
                prisma.pendingItem.count({
                    where: { areaId, status: 'RESOLVED' }
                }),
                prisma.visit.count({
                    where: { areaId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
                }),
                prisma.complaint.count({
                    where: { areaId, status: { in: ['PENDENTE', 'EM_ANALISE'] } }
                }),
            ]);

            const lastVisit = await prisma.visit.findFirst({
                where: { areaId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });

            const input: PatternAnalysisInput = {
                companyId: area.sector.companyId,
                areaName: area.name,
                data: {
                    pendingItems,
                    resolvedItems,
                    visits,
                    complaints,
                    averageResolutionDays: 7, // TODO: calcular de verdade
                    lastVisitDays: lastVisit
                        ? Math.floor((Date.now() - lastVisit.createdAt.getTime()) / (24 * 60 * 60 * 1000))
                        : 999,
                    recentConflicts: [], // TODO: buscar do banco
                }
            };

            const analysis = await aiService.analyzePatterns(input);

            // Salvar alerta se houver risco
            if (analysis.severity !== 'INFO' && analysis.risks.length > 0) {
                await prisma.smartAlert.create({
                    data: {
                        companyId: area.sector.companyId,
                        areaId,
                        type: 'PADRAO',
                        title: `Análise de IA - ${area.name}`,
                        description: analysis.risks.join('; '),
                        aiAnalysis: JSON.stringify(analysis),
                        recommendation: analysis.recommendations.join('; '),
                        severity: analysis.severity,
                        status: 'PENDENTE',
                    }
                });
            }

            res.json({
                areaId,
                areaName: area.name,
                analysis,
                analyzedAt: new Date(),
            });
        } catch (error) {
            console.error('Error analyzing area:', error);
            res.status(500).json({ error: 'Erro na análise de IA' });
        }
    },

    // Obter alertas inteligentes
    async getAlerts(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const { status, severity } = req.query;
            const user = (req as any).user;

            // RH só vê alertas validados e enviados
            const where: any = { companyId };

            if (user.role === 'RH') {
                where.status = 'ENVIADO_RH';
            } else if (status) {
                where.status = status;
            }

            if (severity) {
                where.severity = severity;
            }

            const alerts = await prisma.smartAlert.findMany({
                where,
                include: {
                    area: { select: { name: true } },
                    validatedBy: { select: { name: true } },
                },
                orderBy: [
                    { severity: 'desc' },
                    { createdAt: 'desc' }
                ]
            });

            res.json(alerts);
        } catch (error) {
            console.error('Error getting alerts:', error);
            res.status(500).json({ error: 'Erro ao obter alertas' });
        }
    },

    // Validar alerta
    async validateAlert(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { action } = req.body; // 'validate' ou 'discard'
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const alert = await prisma.smartAlert.update({
                where: { id },
                data: {
                    status: action === 'validate' ? 'VALIDADO' : 'DESCARTADO',
                    validatedAt: new Date(),
                    validatedById: user.userId,
                }
            });

            // Registrar decisão
            await prisma.decisionHistory.create({
                data: {
                    companyId: alert.companyId,
                    entityType: 'ALERT',
                    entityId: id,
                    action: action === 'validate' ? 'VALIDADO' : 'DESCARTADO',
                    reason: action === 'validate' ? 'Alerta validado pela QS' : 'Alerta descartado',
                    decidedById: user.userId,
                }
            });

            res.json(alert);
        } catch (error) {
            console.error('Error validating alert:', error);
            res.status(500).json({ error: 'Erro ao validar alerta' });
        }
    },

    // Enviar alerta para RH
    async sendAlertToRH(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { rhNotes } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const alert = await prisma.smartAlert.update({
                where: { id },
                data: {
                    status: 'ENVIADO_RH',
                    sentToRHAt: new Date(),
                    rhNotes,
                }
            });

            // Registrar decisão
            await prisma.decisionHistory.create({
                data: {
                    companyId: alert.companyId,
                    entityType: 'ALERT',
                    entityId: id,
                    action: 'ENCAMINHADO_RH',
                    reason: rhNotes || 'Alerta enviado ao RH',
                    decidedById: user.userId,
                }
            });

            res.json(alert);
        } catch (error) {
            console.error('Error sending alert to RH:', error);
            res.status(500).json({ error: 'Erro ao enviar alerta' });
        }
    },

    // Obter prioridades inteligentes
    async getPriorities(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Apenas MASTER pode ver prioridades' });
            }

            // Verificar se IA está habilitada
            const settings = await prisma.systemSettings.findUnique({
                where: { companyId }
            });

            if (!settings?.openAIEnabled) {
                return res.status(403).json({ error: 'IA não está habilitada' });
            }

            // Buscar dados de todas as áreas
            const areas = await prisma.area.findMany({
                where: { sector: { companyId } },
                include: { sector: true }
            });

            const areasData = await Promise.all(areas.map(async (area) => {
                const [pendingItems, complaints] = await Promise.all([
                    prisma.pendingItem.count({
                        where: { areaId: area.id, status: { in: ['PENDING', 'IN_PROGRESS'] } }
                    }),
                    prisma.complaint.count({
                        where: { areaId: area.id, status: { in: ['PENDENTE', 'EM_ANALISE'] } }
                    }),
                ]);

                const lastVisit = await prisma.visit.findFirst({
                    where: { areaId: area.id },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                });

                const score = await prisma.qSScore.findFirst({
                    where: { areaId: area.id },
                    orderBy: { calculatedAt: 'desc' },
                    select: { score: true }
                });

                return {
                    name: area.name,
                    score: score?.score || 500,
                    pendingItems,
                    complaints,
                    lastVisitDays: lastVisit
                        ? Math.floor((Date.now() - lastVisit.createdAt.getTime()) / (24 * 60 * 60 * 1000))
                        : 999,
                };
            }));

            const priorities = await aiService.generatePriorities(areasData);

            res.json({
                companyId,
                generatedAt: new Date(),
                priorities,
                areasAnalyzed: areas.length,
            });
        } catch (error) {
            console.error('Error getting priorities:', error);
            res.status(500).json({ error: 'Erro ao obter prioridades' });
        }
    },

    // Gerar resumo executivo
    async getExecutiveSummary(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            // Buscar dados da empresa
            const [areasCount, collaboratorsCount, pendingItems, openComplaints, lastVisit, score] = await Promise.all([
                prisma.area.count({ where: { sector: { companyId } } }),
                prisma.collaboratorProfile.count({ where: { area: { sector: { companyId } } } }),
                prisma.pendingItem.count({ where: { companyId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
                prisma.complaint.count({ where: { companyId, status: { in: ['PENDENTE', 'EM_ANALISE'] } } }),
                prisma.visit.findFirst({ where: { companyId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
                prisma.qSScore.findFirst({ where: { companyId, areaId: null }, orderBy: { calculatedAt: 'desc' }, select: { score: true } }),
            ]);

            const companyData = {
                score: score?.score || 'N/A',
                areasCount,
                collaboratorsCount,
                pendingItems,
                openComplaints,
                lastVisitDate: lastVisit?.createdAt?.toLocaleDateString('pt-BR') || 'Nunca',
            };

            const summary = await aiService.generateExecutiveSummary(companyData);

            res.json({
                companyId,
                generatedAt: new Date(),
                data: companyData,
                summary,
            });
        } catch (error) {
            console.error('Error generating summary:', error);
            res.status(500).json({ error: 'Erro ao gerar resumo' });
        }
    },
};
