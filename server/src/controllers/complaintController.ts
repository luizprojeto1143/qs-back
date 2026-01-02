import { Request, Response } from 'express';
import prisma from '../prisma';

export const complaintController = {
    // Criar nova denúncia
    async create(req: Request, res: Response) {
        try {
            const user = (req as any).user;
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

            if (!settings?.complaintsEnabled) {
                return res.status(403).json({ error: 'Módulo de denúncias não está habilitado' });
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

            res.status(201).json(complaint);
        } catch (error) {
            console.error('Error creating complaint:', error);
            res.status(500).json({ error: 'Erro ao criar denúncia' });
        }
    },

    // Listar denúncias (apenas MASTER)
    async list(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const { status, severity } = req.query;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Apenas MASTER pode ver denúncias' });
            }

            const where: any = { companyId };
            if (status) where.status = status;
            if (severity) where.severity = severity;

            const complaints = await prisma.complaint.findMany({
                where,
                include: {
                    area: { select: { name: true } },
                    reporter: { select: { name: true } },
                    validatedBy: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(complaints);
        } catch (error) {
            console.error('Error listing complaints:', error);
            res.status(500).json({ error: 'Erro ao listar denúncias' });
        }
    },

    // Obter denúncia específica
    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

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

            res.json(complaint);
        } catch (error) {
            console.error('Error getting complaint:', error);
            res.status(500).json({ error: 'Erro ao obter denúncia' });
        }
    },

    // Traduzir denúncia em vídeo LIBRAS
    async translate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { translation } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
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
            console.error('Error translating complaint:', error);
            res.status(500).json({ error: 'Erro ao traduzir denúncia' });
        }
    },

    // Validar denúncia
    async validate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { severity, category } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
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
            console.error('Error validating complaint:', error);
            res.status(500).json({ error: 'Erro ao validar denúncia' });
        }
    },

    // Encaminhar para RH
    async forwardToRH(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { rhNotes } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
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

            // TODO: Enviar notificação ao RH

            res.json(complaint);
        } catch (error) {
            console.error('Error forwarding complaint:', error);
            res.status(500).json({ error: 'Erro ao encaminhar denúncia' });
        }
    },

    // Descartar denúncia
    async discard(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER') {
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
            console.error('Error discarding complaint:', error);
            res.status(500).json({ error: 'Erro ao descartar denúncia' });
        }
    },

    // Resolver denúncia
    async resolve(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { resolution } = req.body;
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
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
                    reason: resolution || 'Denúncia resolvida',
                    decidedById: user.userId,
                }
            });

            res.json(complaint);
        } catch (error) {
            console.error('Error resolving complaint:', error);
            res.status(500).json({ error: 'Erro ao resolver denúncia' });
        }
    },
};
