/**
 * Constantes para tipos de usuário/roles do sistema
 * Centraliza strings mágicas para evitar erros de digitação
 */
export const USER_ROLES = {
    MASTER: 'MASTER',
    RH: 'RH',
    LIDER: 'LIDER',
    COLABORADOR: 'COLABORADOR'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Constantes para status de pendências
 */
export const PENDENCY_STATUS = {
    PENDENTE: 'PENDENTE',
    RESOLVIDA: 'RESOLVIDA',
    CONCLUIDA: 'CONCLUIDA'
} as const;

export type PendencyStatus = typeof PENDENCY_STATUS[keyof typeof PENDENCY_STATUS];

/**
 * Constantes para prioridades
 */
export const PRIORITY = {
    BAIXA: 'BAIXA',
    MEDIA: 'MEDIA',
    ALTA: 'ALTA'
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

/**
 * Constantes para status de agendamentos
 */
export const SCHEDULE_STATUS = {
    PENDENTE: 'PENDENTE',
    APROVADO: 'APROVADO',
    RECUSADO: 'RECUSADO',
    REMARCADO: 'REMARCADO'
} as const;

export type ScheduleStatus = typeof SCHEDULE_STATUS[keyof typeof SCHEDULE_STATUS];

/**
 * Constantes para tipos de denúncia
 */
export const COMPLAINT_TYPES = {
    VIDEO_LIBRAS: 'VIDEO_LIBRAS',
    TEXTO: 'TEXTO',
    ANONIMO: 'ANONIMO'
} as const;

export type ComplaintType = typeof COMPLAINT_TYPES[keyof typeof COMPLAINT_TYPES];

/**
 * Constantes para severidade
 */
export const SEVERITY = {
    BAIXO: 'BAIXO',
    MEDIO: 'MEDIO',
    ALTO: 'ALTO',
    CRITICO: 'CRITICO'
} as const;

export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

/**
 * Constantes para tipos de turno
 */
export const SHIFT_TYPES = {
    '5X2': '5X2',
    '6X1': '6X1',
    '12X36': '12X36',
    '4X3': '4X3',
    PERSONALIZADO: 'PERSONALIZADO'
} as const;

export type ShiftType = typeof SHIFT_TYPES[keyof typeof SHIFT_TYPES];

/**
 * Constantes para QS Score
 */
export const QS_SCORE_CLASSIFICATION = {
    EXCELENTE: 'EXCELENTE',
    BOM: 'BOM',
    ATENCAO: 'ATENCAO',
    RISCO: 'RISCO',
    CRITICO: 'CRITICO'
} as const;

export type QSScoreClassification = typeof QS_SCORE_CLASSIFICATION[keyof typeof QS_SCORE_CLASSIFICATION];

/**
 * Constantes para tendência de score
 */
export const SCORE_TREND = {
    MELHORANDO: 'MELHORANDO',
    ESTAVEL: 'ESTAVEL',
    PIORANDO: 'PIORANDO'
} as const;

export type ScoreTrend = typeof SCORE_TREND[keyof typeof SCORE_TREND];
