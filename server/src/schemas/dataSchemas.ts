import { z } from 'zod';

export const createScheduleSchema = z.object({
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format (YYYY-MM-DD)' })
        .refine((date) => {
            const inputDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            return inputDate >= today;
        }, { message: 'A data não pode ser no passado' }),
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
        consultoria: z.string().optional(),
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
        consultoria: z.string().optional(),
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

// Dedicated schema for updates - all fields optional and more flexible
export const updateCollaboratorSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    companyId: z.string().uuid().optional(),
    matricula: z.string().optional(),
    areaId: z.string().uuid().optional().nullable(), // Allow null for area removal
    shift: z.string().optional().nullable(),
    nextRestDay: z.string().optional().nullable(),
    disabilityType: z.enum(['FISICA', 'AUDITIVA', 'VISUAL', 'INTELECTUAL', 'MULTIPLA', 'TEA', 'OUTRA', 'NENHUMA']).optional().nullable(),
    needsDescription: z.string().optional().nullable()
});

export const createCompanySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cnpj: z.string()
        .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (XX.XXX.XXX/XXXX-XX)')
        .refine((cnpj) => {
            // Additional CNPJ validation using check digits
            const clean = cnpj.replace(/\D/g, '');
            if (clean.length !== 14) return false;
            if (/^(\d)\1+$/.test(clean)) return false;

            let sum = 0, weight = 5;
            for (let i = 0; i < 12; i++) {
                sum += parseInt(clean.charAt(i)) * weight;
                weight = weight === 2 ? 9 : weight - 1;
            }
            let rem = sum % 11;
            let d1 = rem < 2 ? 0 : 11 - rem;
            if (parseInt(clean.charAt(12)) !== d1) return false;

            sum = 0; weight = 6;
            for (let i = 0; i < 13; i++) {
                sum += parseInt(clean.charAt(i)) * weight;
                weight = weight === 2 ? 9 : weight - 1;
            }
            rem = sum % 11;
            let d2 = rem < 2 ? 0 : 11 - rem;
            return parseInt(clean.charAt(13)) === d2;
        }, { message: 'CNPJ inválido (dígitos verificadores incorretos)' }),
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

export const createPendencySchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    responsible: z.string().min(1, 'Responsável é obrigatório'),
    priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
    deadline: z.string().datetime().optional().nullable(),
    companyId: z.string().uuid(),
    areaId: z.string().uuid().optional().nullable(),
    collaboratorId: z.string().uuid().optional().nullable(),
    visitId: z.string().uuid().optional().nullable()
});

export const updatePendencySchema = z.object({
    description: z.string().min(1).optional(),
    responsible: z.string().min(1).optional(),
    priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional(),
    deadline: z.string().datetime().optional().nullable(),
    areaId: z.string().uuid().optional().nullable(),
    collaboratorId: z.string().uuid().optional().nullable(),
    status: z.enum(['PENDENTE', 'RESOLVIDA', 'CONCLUIDA']).optional(),
    resolvedAt: z.string().datetime().optional().nullable()
});

export const createSpecialistSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    type: z.string().min(1, 'Tipo é obrigatório'),
    companyId: z.string().uuid().optional()
});

export const updateSpecialistSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    type: z.string().min(1).optional()
});
