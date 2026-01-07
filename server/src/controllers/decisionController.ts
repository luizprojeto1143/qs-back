import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

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
            sendError500(res, ERROR_CODES.DEC_HISTORY, error);
        }
    }
};
