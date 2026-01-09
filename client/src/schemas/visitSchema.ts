
import { z } from 'zod';

export const visitSchema = z.object({
    companyId: z.string().min(1, 'Selecione uma empresa'),
    areaId: z.string().nullable().optional(), // Can be empty if needed
    collaboratorIds: z.array(z.string()).optional().default([]), // Now optional!
    date: z.string().or(z.date()).optional(), // Made optional - will be injected
    masterId: z.string().optional(), // Injected automatically

    relatos: z.object({
        lideranca: z.string().nullable().optional(),
        colaborador: z.string().nullable().optional(),
        consultoria: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
        audioLideranca: z.string().nullable().optional(),
        audioColaborador: z.string().nullable().optional()
    }),

    avaliacoes: z.object({
        area: z.record(z.string(), z.number()).optional(), // Dynamic keys: criteriaName -> rating
        lideranca: z.record(z.string(), z.number()).optional(),
        colaborador: z.record(z.string(), z.number()).optional()
    }),

    pendencias: z.array(z.object({
        responsibleId: z.string().min(1, 'Responsável obrigatório'),
        description: z.string().min(1, 'Descrição obrigatória'),
        deadline: z.string().min(1, 'Prazo obrigatório'), // Date string YYYY-MM-DD
        priority: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
        status: z.enum(['PENDENTE', 'CONCLUIDO'])
    })).optional().default([]),

    anexos: z.array(z.object({
        url: z.string().url(),
        type: z.string(),
        name: z.string()
    })).optional().default([]),

    notes: z.array(z.object({
        collaboratorId: z.string(),
        content: z.string()
    })).optional().default([])
});

export type VisitFormData = z.infer<typeof visitSchema>;
