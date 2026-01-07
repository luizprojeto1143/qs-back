import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const mediationController = {
    // Criar nova mediação
    async create(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            if (!user) return res.status(401).json({ error: 'Não autenticado' });

            const {
                companyId,
                areaId,
                date,
                theme,
                description,
                participants, // JSON Array
                confidentiality,
                notes,
                leaderId
            } = req.body;

            // Verificar permissão
            const settings = await prisma.systemSettings.findUnique({
                where: { companyId }
            });

            if (!settings?.mediationsEnabled) {
                return res.status(403).json({ error: 'Módulo de mediação não está habilitado' });
            }

            const mediation = await prisma.mediation.create({
                data: {
                    companyId,
                    areaId,
                    date: new Date(date),
                    theme,
                    description,
                    participants: JSON.stringify(participants || []),
                    result: 'PENDENTE',
                    confidentiality: confidentiality || 'RESTRITO',
                    notes,
                    createdById: user.userId,
                    leaderId,
                }
            });

            res.status(201).json(mediation);
        } catch (error) {
            sendError500(res, ERROR_CODES.MED_CREATE, error);
        }
    },

    // Listar mediações
    async list(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const { status, startDate, endDate } = req.query;
            const user = (req as AuthRequest).user;
            if (!user) return res.status(401).json({ error: 'Não autenticado' });

            // RH e Master podem ver
            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const where: any = { companyId };

            if (status) where.result = status;

            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            const mediations = await prisma.mediation.findMany({
                where,
                include: {
                    area: { select: { name: true } },
                    createdBy: { select: { name: true } },
                    leader: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            });

            const parsedMediations = mediations.map(m => ({
                ...m,
                participants: m.participants ? JSON.parse(m.participants) : []
            }));

            res.json(parsedMediations);
        } catch (error) {
            sendError500(res, ERROR_CODES.MED_LIST, error);
        }
    },

    // Obter mediação específica
    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            if (!user) return res.status(401).json({ error: 'Não autenticado' });

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const mediation = await prisma.mediation.findUnique({
                where: { id },
                include: {
                    area: true,
                    createdBy: { select: { id: true, name: true, role: true } },
                    leader: { select: { id: true, name: true } }
                }
            });

            if (!mediation) {
                return res.status(404).json({ error: 'Mediação não encontrada' });
            }

            res.json({
                ...mediation,
                participants: mediation.participants ? JSON.parse(mediation.participants) : []
            });
        } catch (error) {
            sendError500(res, ERROR_CODES.MED_GET, error);
        }
    },

    // Atualizar detalhes da mediação
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                date,
                theme,
                description,
                participants,
                notes,
                confidentiality,
                leaderId,
                areaId
            } = req.body;

            const user = (req as AuthRequest).user;
            if (!user) return res.status(401).json({ error: 'Não autenticado' });
            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const mediation = await prisma.mediation.update({
                where: { id },
                data: {
                    date: date ? new Date(date) : undefined,
                    theme,
                    description,
                    participants: participants ? JSON.stringify(participants) : undefined,
                    notes,
                    confidentiality,
                    leaderId: leaderId || undefined,
                    areaId: areaId || undefined
                }
            });

            res.json(mediation);
        } catch (error) {
            sendError500(res, ERROR_CODES.MED_UPDATE, error);
        }
    },

    // Concluir mediação (Registrar Resultado)
    async conclude(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { result, resultDetails } = req.body; // ACORDO, SEM_ACORDO, ENCAMINHAMENTO
            const user = (req as AuthRequest).user;
            if (!user) return res.status(401).json({ error: 'Não autenticado' });

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const mediation = await prisma.mediation.update({
                where: { id },
                data: {
                    result, // ACORDO, SEM_ACORDO, ENCAMINHAMENTO
                    resultDetails,
                    updatedAt: new Date()
                }
            });

            // Registrar no Histórico de Decisões
            await prisma.decisionHistory.create({
                data: {
                    companyId: mediation.companyId,
                    entityType: 'MEDIATION',
                    entityId: id,
                    action: result,
                    reason: resultDetails || `Mediação concluída com resultado: ${result}`,
                    decidedById: user.userId,
                }
            });

            res.json(mediation);
        } catch (error) {
            sendError500(res, ERROR_CODES.MED_CONCLUDE, error);
        }
    }
};
