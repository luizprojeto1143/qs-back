import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';
import { AuthRequest } from '../middleware/authMiddleware';

export const complaintController = {
    // Criar nova denúncia
    async create(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const {
                companyId,
                areaId,
                type, // VIDEO_LIBRAS, TEXTO, ANONIMO
                videoUrl,
                content,
                category,
                severity,
            } = req.body;

            // Verificar se denúncias estão habilitadas
            const settings = await prisma.systemSettings.findUnique({
                where: { companyId }
            });

            if (settings && !settings.complaintsEnabled) {
                return res.status(403).json({ error: 'Módulo de denúncias não está habilitado' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const complaint = await prisma.complaint.create({
                data: {
                    companyId,
                    areaId,
                    reporterId: type === 'ANONIMO' ? null : user.userId,
                    type,
                    videoUrl,
                    content,
                    category,
                    severity: severity || 'MEDIO',
                    status: 'PENDENTE',
                    confidentiality: 'CONFIDENCIAL',
                }
            });

            // Emitir evento via Socket.io para a empresa
            const io = req.app.get('io');
            if (io) {
                io.to(`company:${companyId}`).emit('new_complaint', complaint);
            }

            res.status(201).json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_CREATE, error);
        }
    },

    // Listar denúncias da empresa do usuário (para RH)
    async listForCurrentUser(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            if (!user || !user.companyId) {
                return res.status(400).json({ error: 'User or Company not found' });
            }
            // Redireciona para list com companyId do usuário
            req.params.companyId = user.companyId;
            return complaintController.list(req, res);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_LIST, error);
        }
    },

    // Listar denúncias
    async list(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const { status, severity } = req.query;
            const user = (req as AuthRequest).user;

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Apenas MASTER e RH podem ver denúncias' });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const where: any = { companyId };

            // Se for RH, só vê o que foi encaminhado ou resolvido (se tiver permissão)
            if (user.role === 'RH') {
                where.status = { in: ['ENCAMINHADO_RH', 'RESOLVIDO'] };
            } else {
                // Se for Master, filtros opcionais
                if (status) where.status = status;
            }

            if (severity) where.severity = severity;

            const [complaints, total] = await Promise.all([
                prisma.complaint.findMany({
                    where,
                    include: {
                        area: { select: { name: true } },
                        reporter: { select: { name: true } },
                        validatedBy: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: skip
                }),
                prisma.complaint.count({ where })
            ]);

            res.json({
                data: complaints,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_LIST, error);
        }
    },

    // Obter denúncia específica
    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;

            const complaint = await prisma.complaint.findUnique({
                where: { id },
                include: {
                    area: true,
                    reporter: { select: { id: true, name: true } },
                    validatedBy: { select: { id: true, name: true } },
                }
            });

            if (!complaint) {
                return res.status(404).json({ error: 'Denúncia não encontrada' });
            }

            // Permissão de Visualização
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (user.role === 'RH') {
                // RH só vê se estiver encaminhado ou resolvido
                if (!['ENCAMINHADO_RH', 'RESOLVIDO'].includes(complaint.status)) {
                    return res.status(403).json({ error: 'Sem permissão para visualizar esta denúncia' });
                }
            } else if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_GET, error);
        }
    },

    // Traduzir denúncia em vídeo LIBRAS
    async translate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { translation } = req.body;
            const user = (req as AuthRequest).user;

            if (!user || user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    translation,
                    status: 'EM_ANALISE',
                }
            });

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_UPDATE, error);
        }
    },

    // Validar denúncia
    async validate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { severity, category } = req.body;
            const user = (req as AuthRequest).user;

            if (!user || user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    status: 'VALIDADO',
                    severity: severity || undefined,
                    category: category || undefined,
                    validatedAt: new Date(),
                    validatedById: user.userId,
                }
            });

            // Registrar decisão
            await prisma.decisionHistory.create({
                data: {
                    companyId: complaint.companyId,
                    entityType: 'COMPLAINT',
                    entityId: id,
                    action: 'VALIDADO',
                    reason: 'Denúncia validada pela QS',
                    decidedById: user.userId,
                }
            });

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_UPDATE, error);
        }
    },

    // Encaminhar para RH
    async forwardToRH(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { rhNotes } = req.body;
            const user = (req as AuthRequest).user;

            if (!user || user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    status: 'ENCAMINHADO_RH',
                    confidentiality: 'COMPARTILHAVEL',
                    sentToRHAt: new Date(),
                }
            });

            // Registrar decisão
            await prisma.decisionHistory.create({
                data: {
                    companyId: complaint.companyId,
                    entityType: 'COMPLAINT',
                    entityId: id,
                    action: 'ENCAMINHADO_RH',
                    reason: rhNotes || 'Encaminhado ao RH para ação',
                    decidedById: user.userId,
                }
            });

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_UPDATE, error);
        }
    },

    // Descartar denúncia
    async discard(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user = (req as AuthRequest).user;

            if (!user || user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    status: 'DESCARTADO',
                }
            });

            // Registrar decisão
            await prisma.decisionHistory.create({
                data: {
                    companyId: complaint.companyId,
                    entityType: 'COMPLAINT',
                    entityId: id,
                    action: 'DESCARTADO',
                    reason: reason || 'Denúncia descartada',
                    decidedById: user.userId,
                }
            });

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_DELETE, error);
        }
    },

    // Resolver denúncia
    async resolve(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { resolution } = req.body;
            const user = (req as AuthRequest).user;

            if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            // Validar se tem resolução
            if (!resolution || !resolution.trim()) {
                return res.status(400).json({ error: 'A resolução é obrigatória para encerrar a denúncia.' });
            }

            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    status: 'RESOLVIDO',
                    resolution,
                    resolvedAt: new Date(),
                }
            });

            // Registrar decisão
            await prisma.decisionHistory.create({
                data: {
                    companyId: complaint.companyId,
                    entityType: 'COMPLAINT',
                    entityId: id,
                    action: 'RESOLVIDO',
                    reason: resolution,
                    decidedById: user.userId,
                }
            });

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_UPDATE, error);
        }
    },

    // Atualizar status (Genérico para RH/Master)
    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;
            const user = (req as AuthRequest).user;

            if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            // Validar status permitido
            const allowedStatuses = ['EM_ANALISE', 'VALIDADO', 'ENCAMINHADO_RH', 'RESOLVIDO', 'DESCARTADO'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ error: 'Status inválido' });
            }

            const complaint = await prisma.complaint.update({
                where: { id },
                data: { status }
            });

            // Registrar decisão no histórico
            await prisma.decisionHistory.create({
                data: {
                    companyId: complaint.companyId,
                    entityType: 'COMPLAINT',
                    entityId: id,
                    action: status,
                    reason: reason || `Status atualizado para ${status}`,
                    decidedById: user.userId,
                }
            });

            res.json(complaint);
        } catch (error) {
            sendError500(res, ERROR_CODES.COMPL_UPDATE, error);
        }
    },
};
