import { Request, Response } from 'express';
import prisma from '../prisma';

export const systemSettingsController = {
    // Obter configurações da empresa
    async getSettings(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            // Apenas MASTER pode ver todas as configurações
            if (user.role !== 'MASTER' && user.companyId !== companyId) {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            let settings = await prisma.systemSettings.findUnique({
                where: { companyId }
            });

            // Criar configurações padrão se não existir
            if (!settings) {
                settings = await prisma.systemSettings.create({
                    data: { companyId }
                });
            }

            // Se for RH, filtrar o que pode ver
            if (user.role === 'RH') {
                return res.json({
                    qsScoreEnabled: settings.qsScoreEnabled && settings.rhCanSeeQSScore,
                    riskMapEnabled: settings.riskMapEnabled && settings.rhCanSeeRiskMap,
                    aiAlertsEnabled: settings.aiAlertsEnabled && settings.rhCanSeeAlerts,
                    complaintsEnabled: settings.complaintsEnabled,
                    mediationsEnabled: settings.mediationsEnabled,
                    workScheduleEnabled: settings.workScheduleEnabled,
                });
            }

            res.json(settings);
        } catch (error) {
            console.error('Error getting settings:', error);
            res.status(500).json({ error: 'Erro ao obter configurações' });
        }
    },

    // Atualizar configurações (somente MASTER)
    async updateSettings(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Apenas MASTER pode alterar configurações' });
            }

            const {
                qsScoreEnabled,
                riskMapEnabled,
                aiAlertsEnabled,
                complaintsEnabled,
                mediationsEnabled,
                workScheduleEnabled,
                rhCanSeeQSScore,
                rhCanSeeRiskMap,
                rhCanSeeAlerts,
                openAIEnabled,
                autoAnalysisInterval,
            } = req.body;

            const settings = await prisma.systemSettings.upsert({
                where: { companyId },
                create: {
                    companyId,
                    qsScoreEnabled: qsScoreEnabled ?? false,
                    riskMapEnabled: riskMapEnabled ?? false,
                    aiAlertsEnabled: aiAlertsEnabled ?? false,
                    complaintsEnabled: complaintsEnabled ?? false,
                    mediationsEnabled: mediationsEnabled ?? false,
                    workScheduleEnabled: workScheduleEnabled ?? false,
                    rhCanSeeQSScore: rhCanSeeQSScore ?? false,
                    rhCanSeeRiskMap: rhCanSeeRiskMap ?? false,
                    rhCanSeeAlerts: rhCanSeeAlerts ?? false,
                    openAIEnabled: openAIEnabled ?? false,
                    autoAnalysisInterval: autoAnalysisInterval ?? 7,
                },
                update: {
                    qsScoreEnabled,
                    riskMapEnabled,
                    aiAlertsEnabled,
                    complaintsEnabled,
                    mediationsEnabled,
                    workScheduleEnabled,
                    rhCanSeeQSScore,
                    rhCanSeeRiskMap,
                    rhCanSeeAlerts,
                    openAIEnabled,
                    autoAnalysisInterval,
                }
            });

            // Registrar no histórico de decisões
            await prisma.decisionHistory.create({
                data: {
                    companyId,
                    entityType: 'SETTINGS',
                    entityId: settings.id,
                    action: 'ATUALIZADO',
                    reason: 'Configurações do sistema atualizadas',
                    details: JSON.stringify(req.body),
                    decidedById: user.userId,
                }
            });

            res.json(settings);
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações' });
        }
    },

    // Habilitar/desabilitar funcionalidade específica
    async toggleFeature(req: Request, res: Response) {
        try {
            const { companyId, feature } = req.params;
            const { enabled } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Apenas MASTER pode alterar configurações' });
            }

            const validFeatures = [
                'qsScoreEnabled',
                'riskMapEnabled',
                'aiAlertsEnabled',
                'complaintsEnabled',
                'mediationsEnabled',
                'workScheduleEnabled',
                'rhCanSeeQSScore',
                'rhCanSeeRiskMap',
                'rhCanSeeAlerts',
                'openAIEnabled',
            ];

            if (!validFeatures.includes(feature)) {
                return res.status(400).json({ error: 'Funcionalidade inválida' });
            }

            const settings = await prisma.systemSettings.upsert({
                where: { companyId },
                create: {
                    companyId,
                    [feature]: enabled,
                },
                update: {
                    [feature]: enabled,
                }
            });

            res.json({ feature, enabled, settings });
        } catch (error) {
            console.error('Error toggling feature:', error);
            res.status(500).json({ error: 'Erro ao alternar funcionalidade' });
        }
    },
};
