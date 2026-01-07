import { Request, Response } from 'express';
import { analyzeInclusionData } from '../services/openaiService';
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
        const [complaints, collaborators, areas] = await Promise.all([
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
            })
        ]);

        // Dados compilados para a IA
        const analysisData = {
            totalCollaborators: collaborators,
            totalComplaints: complaints.length,
            complaintsByType: complaints.reduce((acc: any, curr) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1;
                return acc;
            }, {}),
            areasCount: areas.length,
            currentScore: 780 // Mock para MVP
        };

        // 2. Chama o serviço de IA
        const analysisResult = await analyzeInclusionData(analysisData);

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
    res.json([
        { id: 1, severity: 'ALTO', title: 'Concentração de Denúncias', description: 'Setor Comercial apresenta 40% das denúncias.' },
        { id: 2, severity: 'MEDIO', title: 'Baixa Diversidade', description: 'Setor TI com 0% de mulheres.' }
    ]);
};

// --- Objeto Exportado para Rotas QS Inclusion ---

export const aiController = {
    analyzePatterns,

    analyzeArea: async (req: Request, res: Response) => {
        // Implementação Mock para Area
        res.json({ message: 'Análise de área realizada com sucesso', risk: 'BAIXO' });
    },

    getAlerts: getSmartAlerts,

    validateAlert: async (req: Request, res: Response) => {
        res.json({ success: true, message: 'Alerta validado' });
    },

    sendAlertToRH: async (req: Request, res: Response) => {
        res.json({ success: true, message: 'Alerta enviado ao RH' });
    },

    getPriorities: async (req: Request, res: Response) => {
        res.json([
            { id: 1, action: 'Treinamento de LIBRAS para Gestores', priority: 'ALTA' },
            { id: 2, action: 'Revisão de Acessibilidade Física', priority: 'MEDIA' }
        ]);
    },

    getExecutiveSummary: async (req: Request, res: Response) => {
        const { companyId } = req.params;
        res.json({
            companyId,
            summary: "A empresa apresenta bons índices de inclusão, com destaque para a retenção de talentos PCD. Atenção necessária para acessibilidade digital.",
            sentiment: "POSITIVO"
        });
    }
};
