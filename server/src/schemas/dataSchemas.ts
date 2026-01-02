import { z } from 'zod';

export const createScheduleSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' }),
    time: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Invalid time format (HH:MM)' }),
    reason: z.string().optional(),
    collaboratorId: z.string().uuid().optional().nullable()
});

export const createVisitSchema = z.object({
    companyId: z.string().uuid(),
    areaId: z.string().uuid().optional().nullable(),
    collaboratorIds: z.array(z.string().uuid()),
    relatos: z.object({
        lideranca: z.string().optional(),
        colaborador: z.string().optional(),
        observacoes: z.string().optional()
    }),
    avaliacoes: z.object({
        area: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
        lideranca: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
        colaborador: z.union([z.string(), z.record(z.string(), z.any())]).optional()
    }).optional(),
    pendencias: z.array(z.object({
        description: z.string(),
        responsible: z.string(),
        priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
        deadline: z.string().optional().nullable(),
        collaboratorId: z.string().uuid().optional().nullable()
    })).optional(),
    anexos: z.array(z.object({
        type: z.string(),
        url: z.string().url(),
        name: z.string().optional()
    })).optional(),
    individualNotes: z.array(z.object({
        collaboratorId: z.string().uuid(),
        content: z.string()
    })).optional()
});

export const updateVisitSchema = z.object({
    companyId: z.string().uuid(),
    areaId: z.string().uuid().optional().nullable(),
    collaboratorIds: z.array(z.string().uuid()),
    relatos: z.object({
        lideranca: z.string().optional(),
        colaborador: z.string().optional(),
        observacoes: z.string().optional()
    }),
    avaliacoes: z.object({
        area: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
        lideranca: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
        colaborador: z.union([z.string(), z.record(z.string(), z.any())]).optional()
    }).optional(),
    pendencias: z.array(z.object({
        id: z.string().optional(), // Allow ID for updates
        description: z.string(),
        responsible: z.string(),
        priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
        deadline: z.string().optional().nullable(),
        collaboratorId: z.string().uuid().optional().nullable(),
        status: z.string().optional() // Allow status update
    })).optional(),
    anexos: z.array(z.object({
        id: z.string().optional(), // Allow ID to identify existing attachments
        type: z.string(),
        url: z.string().url(),
        name: z.string().optional()
    })).optional(),
    individualNotes: z.array(z.object({
        id: z.string().optional(), // Allow ID
        collaboratorId: z.string().uuid(),
        content: z.string()
    })).optional()
});

export const createPDISchema = z.object({
    userId: z.string().uuid(),
    objective: z.string().min(1, 'Objetivo é obrigatório'),
    skills: z.string().min(1, 'Habilidades são obrigatórias'),
    actions: z.string().min(1, 'Ações são obrigatórias')
});

export const updatePDISchema = z.object({
    objective: z.string().optional(),
    skills: z.string().optional(),
    actions: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional()
});

export const createFeedPostSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    category: z.string().min(1, 'Categoria é obrigatória'),
    imageUrl: z.string().url().optional().nullable(),
    videoLibrasUrl: z.string().url().optional().nullable()
});

export const createCollaboratorSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(), // Optional for updates or auto-generated
    companyId: z.string().uuid(),
    matricula: z.string().min(1, 'Matrícula é obrigatória'),
    areaId: z.string().uuid(),
    shift: z.string().optional(),
    nextRestDay: z.string().optional(),
    disabilityType: z.enum(['FISICA', 'AUDITIVA', 'VISUAL', 'INTELECTUAL', 'MULTIPLA', 'TEA', 'OUTRA', 'NENHUMA']).optional().default('NENHUMA'),
    needsDescription: z.string().optional()
});

export const createCompanySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (XX.XXX.XXX/XXXX-XX)'),
    email: z.string().email('Email inválido').optional(),
    active: z.boolean().optional()
});

export const createUserSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    role: z.enum(['MASTER', 'RH', 'LIDER', 'COLABORADOR']),
    companyId: z.string().uuid().optional()
});
