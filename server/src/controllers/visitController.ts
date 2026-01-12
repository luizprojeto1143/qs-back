import { Request, Response } from 'express';
import { VisitService } from '../services/visitService';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';

const visitService = new VisitService();

// Validation Schemas
const createVisitSchema = z.object({
    date: z.string().or(z.date()).optional(), // Now optional - will use current date
    time: z.string().optional(),
    companyId: z.string(),
    areaId: z.string().nullable().optional(),
    masterId: z.string().optional(), // Now optional - will be injected from auth
    collaboratorIds: z.array(z.string()).optional().default([]), // Now optional with default
    relatos: z.object({
        lideranca: z.string().nullable().optional(),
        colaborador: z.string().nullable().optional(),
        consultoria: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
        audioLideranca: z.string().nullable().optional(),
        audioColaborador: z.string().nullable().optional()
    }).optional().default({}), // Now optional with default
    avaliacoes: z.object({
        area: z.any().optional(),
        lideranca: z.any().optional(),
        colaborador: z.any().optional()
    }).optional().default({}), // Now optional with default
    pendencias: z.array(z.any()).optional().default([]), // Now optional with default
    anexos: z.array(z.any()).optional().default([]), // Now optional with default
    notes: z.array(z.any()).optional().default([]), // Array of Note data
    isFinished: z.boolean().optional(),
    scheduleId: z.string().optional()
});

export const createVisit = async (req: Request, res: Response) => {
    try {
        const validation = createVisitSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error });
        }

        // Extract masterId from authenticated user (from JWT token)
        const authReq = req as AuthRequest;
        const masterId = authReq.user?.userId || validation.data.masterId;

        if (!masterId) {
            return res.status(400).json({ error: 'MasterId is required (user must be authenticated)' });
        }

        // Inject masterId from auth
        const visitData = {
            ...validation.data,
            masterId
        };

        const visit = await visitService.create(visitData);
        return res.status(201).json(visit);
    } catch (error: any) {
        console.error('Error creating visit:', error);
        return res.status(500).json({ error: error.message || 'Error creating visit' });
    }
};

export const listVisits = async (req: Request, res: Response) => {
    try {
        const { companyId, areaId, status, masterId, collaboratorId, startDate, endDate, page, limit } = req.query;

        if (!companyId) { // Basic check, though usually middleware handles context
            // Assuming context middleware sets something? Or explicit param?
            // Using req.query.companyId as per old code structure assumption
        }

        const result = await visitService.list(
            companyId as string,
            {
                areaId: areaId as string,
                status: status as string,
                masterId: masterId as string,
                collaboratorId: collaboratorId as string,
                startDate: startDate as string,
                endDate: endDate as string
            },
            Number(page) || 1,
            Number(limit) || 10
        );

        return res.json(result);
    } catch (error: any) {
        console.error('Error listing visits:', error);
        return res.status(500).json({ error: 'Error listing visits' });
    }
};

export const getVisit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.headers['x-company-id'] as string; // Optional security check

        const visit = await visitService.getById(id, companyId);
        return res.json(visit);
    } catch (error: any) {
        // console.error('Error fetching visit:', error); // Silent validation errors
        if (error.message === 'Visita não encontrada') {
            return res.status(404).json({ error: 'Visit not found' });
        }
        return res.status(500).json({ error: 'Error fetching visit' });
    }
};

// Update not fully implemented in Service yet for full logic?
// The corrupted file had update logic.
// I will just stub update for now or implement if critical.
// Since User asked to "apply everything to test", if update is critical, I might break it.
// Checking visitService.ts (Step 205), it has `create`, `list`, `getById`.
// It DOES NOT have `update`.
// This is a risk.
// However, the corrupted file showed `update` logic.
// I should probably move that corrupted logic to `visitService.ts` properly or just restore it here?
// Given `visitService.ts` is already clean, I don't want to pollute it with the messy update logic right now.
// I will keep ONLY create/list/get for now, as that covers "Recording" (Create) and "History" (List/Get).
// Update is usually used for editing a report later.
// I will comment out update or provide a basic error.
export const updateVisit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = createVisitSchema.partial().safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error });
        }

        const data = validation.data;

        // Import prisma for direct update (service layer doesn't have update yet)
        const prisma = (await import('../prisma')).default;

        // Build update data object - only include defined fields
        const updateData: any = {};

        if (data.date) updateData.date = new Date(data.date as string);
        if (data.time !== undefined) updateData.time = data.time;
        if (data.areaId !== undefined) updateData.areaId = data.areaId || null;

        if (data.relatos) {
            if (data.relatos.lideranca !== undefined) updateData.relatoLideranca = data.relatos.lideranca;
            if (data.relatos.colaborador !== undefined) updateData.relatoColaborador = data.relatos.colaborador;
            if (data.relatos.consultoria !== undefined) updateData.relatoConsultoria = data.relatos.consultoria;
            if (data.relatos.observacoes !== undefined) updateData.observacoesMaster = data.relatos.observacoes;
            if (data.relatos.audioLideranca !== undefined) updateData.audioLiderancaUrl = data.relatos.audioLideranca;
            if (data.relatos.audioColaborador !== undefined) updateData.audioColaboradorUrl = data.relatos.audioColaborador;
        }

        // Update collaborators if provided
        if (data.collaboratorIds && Array.isArray(data.collaboratorIds)) {
            // Verify collaborators exist before connecting
            // NOTE: Frontend sends User IDs, but we need CollaboratorProfile IDs
            let existingCollaborators = await prisma.collaboratorProfile.findMany({
                where: { userId: { in: data.collaboratorIds } },
                select: { id: true }
            });

            // If not found by userId, try by id directly (for backwards compatibility)
            if (existingCollaborators.length === 0 && data.collaboratorIds.length > 0) {
                existingCollaborators = await prisma.collaboratorProfile.findMany({
                    where: { id: { in: data.collaboratorIds } },
                    select: { id: true }
                });
            }

            const validIds = existingCollaborators.map(c => c.id);

            if (validIds.length > 0) {
                updateData.collaborators = {
                    set: validIds.map(cId => ({ id: cId }))
                };
            } else if (data.collaboratorIds.length === 0) {
                // Empty array means disconnect all
                updateData.collaborators = { set: [] };
            }
            // If no valid IDs found but array wasn't empty, log warning
            if (validIds.length !== data.collaboratorIds.length) {
                console.warn(`Warning: Some collaboratorIds not found. Sent: ${data.collaboratorIds.length}, Found: ${validIds.length}`);
            }
        }

        // Update main visit record
        const visit = await prisma.visit.update({
            where: { id },
            data: updateData
        });

        return res.json(visit);
    } catch (error: any) {
        console.error('Error updating visit:', error);
        return res.status(500).json({ error: error.message || 'Error updating visit' });
    }
};

export const deleteVisit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const prisma = (await import('../prisma')).default;

        // Verify visit exists and user has permission
        const visit = await prisma.visit.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!visit) {
            return res.status(404).json({ error: 'Acompanhamento não encontrado' });
        }

        // Only MASTER can delete, or the creator
        if (authReq.user.role !== 'MASTER' && visit.masterId !== authReq.user.userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir este acompanhamento' });
        }

        // Delete related records first (cascade doesn't work for all relations)
        await prisma.visitNote.deleteMany({ where: { visitId: id } });
        await prisma.visitEvaluation.deleteMany({ where: { visitId: id } });
        await prisma.visitAttachment.deleteMany({ where: { visitId: id } });
        await prisma.pendingItem.updateMany({
            where: { visitId: id },
            data: { visitId: null }
        });

        // Delete the visit
        await prisma.visit.delete({ where: { id } });

        return res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting visit:', error);
        return res.status(500).json({ error: error.message || 'Erro ao excluir acompanhamento' });
    }
};

