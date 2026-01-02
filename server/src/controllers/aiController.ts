import { Request, Response } from 'express';
import { analyzeInclusionData } from '../services/openaiService';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const analyzePatterns = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        // 1. Coleta dados reais do banco (Simplificado para MVP)
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
            // Simulação de score (futuramente pegar da tabela QSScore)
            currentScore: 780
        };

        // 2. Chama o serviço de IA
        const analysisResult = await analyzeInclusionData(analysisData);

        // 3. (Opcional) Salvar histórico de decisão/análise
        // await prisma.decisionHistory.create(...)

        res.json({
            timestamp: new Date(),
            data: analysisData,
            ai: analysisResult
        });

    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({ error: 'Internal Server Error during AI Analysis' });
    }
};

export const getSmartAlerts = async (req: Request, res: Response) => {
    // Retornar alertas gerados (Mock por enquanto)
    res.json([
        { id: 1, severity: 'ALTO', title: 'Concentração de Denúncias', description: 'Setor Comercial apresenta 40% das denúncias.' },
        { id: 2, severity: 'MEDIO', title: 'Baixa Diversidade', description: 'Setor TI com 0% de mulheres.' }
    ]);
};
