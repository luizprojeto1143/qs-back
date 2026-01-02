import { Request, Response } from 'express';
import prisma from '../prisma';

export const decisionController = {
    // Obter histórico de decisões de uma entidade
    async getHistory(req: Request, res: Response) {
        try {
            const { entityType, entityId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const history = await prisma.decisionHistory.findMany({
                where: {
                    entityType,
                    entityId
                },
                include: {
                    decidedBy: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { decidedAt: 'desc' }
            });

            res.json(history);
        } catch (error) {
            console.error('Error getting decision history:', error);
            res.status(500).json({ error: 'Erro ao obter histórico' });
        }
    }
};
