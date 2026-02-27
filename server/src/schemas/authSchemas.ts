import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['MASTER', 'RH', 'LIDER', 'COLABORADOR']).optional(),
    companyId: z.string().uuid().optional()
});

export const registerCollaboratorSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    matricula: z.string().min(1),
    areaId: z.string().uuid(),
    companyId: z.string().uuid(),
    shift: z.string().optional(),
    nextRestDay: z.string().optional(),
    disabilityType: z.string().optional(),
    needsDescription: z.string().optional(),
    avatar: z.string().optional().nullable() // Photo is now optional
});

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['MASTER', 'RH', 'LIDER', 'COLABORADOR']),
    companyId: z.string().optional().nullable().transform(val => val === '' ? null : val),
    areaId: z.string().optional().nullable().transform(val => val === '' ? null : val)
});

export const updateUserSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).optional(),
    role: z.enum(['MASTER', 'RH', 'LIDER', 'COLABORADOR']).optional(),
    companyId: z.string().optional().nullable().transform(val => val === '' ? null : val),
    areaId: z.string().optional().nullable().transform(val => val === '' ? null : val),
    active: z.boolean().optional(),
    password: z.string().min(6).optional().or(z.literal(''))
});
