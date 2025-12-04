import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const listReports = async (req: Request, res: Response) => {
    // For now, return a static list or empty list since we don't store reports in DB yet
    // In a real app, this would query a 'Report' table
    res.json([]);
};

export const generateReport = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const { type } = req.body; // 'GENERAL', 'PENDENCIES', 'VISITS'

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        let data: any = {};

        if (type === 'GENERAL') {
            const [visits, pendencies, collaborators] = await Promise.all([
                prisma.visit.count({ where: { companyId: user.companyId } }),
                prisma.pendingItem.count({ where: { companyId: user.companyId, status: 'PENDENTE' } }),
                prisma.user.count({ where: { companyId: user.companyId, role: 'COLABORADOR' } })
            ]);
            data = { visits, pendencies, collaborators };
        }

        // In a real app, we would generate a PDF/CSV here and upload to storage
        // For now, we return the data so the frontend can "download" it as JSON

        res.json({
            success: true,
            message: 'Relatório gerado com sucesso',
            data,
            fileName: `relatorio_${type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
};
