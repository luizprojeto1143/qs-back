import { Response } from 'express';

/**
 * Centralized error handling utility
 * Provides consistent error responses across the API
 */

export interface ApiError {
    code: string;
    message: string;
    details?: string;
}

// Error codes by module
export const ERROR_CODES = {
    // Auth errors (AUTH_xxx)
    AUTH_CREATE_USER: 'AUTH_001',
    AUTH_LOGIN: 'AUTH_002',
    AUTH_REGISTER_COLLABORATOR: 'AUTH_003',
    AUTH_GET_PROFILE: 'AUTH_004',
    AUTH_SETUP_2FA: 'AUTH_005',
    AUTH_VERIFY_2FA: 'AUTH_006',
    AUTH_DISABLE_2FA: 'AUTH_007',
    AUTH_VALIDATION: 'AUTH_008',
    AUTH_CHECK: 'AUTH_009',
    AUTH_LOGOUT: 'AUTH_010',

    // User errors (USER_xxx)
    USER_LIST: 'USER_001',
    USER_CREATE: 'USER_002',
    USER_UPDATE: 'USER_003',
    USER_DELETE: 'USER_004',

    // Collaborator errors (COLAB_xxx)
    COLAB_LIST: 'COLAB_001',
    COLAB_CREATE: 'COLAB_002',
    COLAB_GET: 'COLAB_003',
    COLAB_UPDATE: 'COLAB_004',
    COLAB_DELETE: 'COLAB_005',

    // Company errors (COMP_xxx)
    COMP_STRUCTURE: 'COMP_001',
    COMP_CREATE: 'COMP_002',
    COMP_LIST: 'COMP_003',
    COMP_UPDATE: 'COMP_004',
    COMP_DELETE: 'COMP_005',
    SECTOR_CREATE: 'COMP_006',
    SECTOR_LIST: 'COMP_007',
    SECTOR_UPDATE: 'COMP_008',
    AREA_CREATE: 'COMP_009',
    AREA_LIST: 'COMP_010',
    AREA_UPDATE: 'COMP_011',
    AREA_DELETE: 'COMP_012',
    SECTOR_DELETE: 'COMP_013',

    // Visit errors (VISIT_xxx)
    VISIT_CREATE: 'VISIT_001',
    VISIT_LIST: 'VISIT_002',
    VISIT_GET: 'VISIT_003',
    VISIT_UPDATE: 'VISIT_004',

    // Pendency errors (PEND_xxx)
    PEND_LIST: 'PEND_001',
    PEND_CREATE: 'PEND_002',
    PEND_UPDATE: 'PEND_003',
    PEND_DELETE: 'PEND_004',

    // Schedule errors (SCHED_xxx)
    SCHED_CREATE: 'SCHED_001',
    SCHED_LIST: 'SCHED_002',
    SCHED_UPDATE: 'SCHED_003',

    // Work Schedule errors (WORK_xxx)
    WORK_GET: 'WORK_001',
    WORK_SAVE: 'WORK_002',
    WORK_LIST: 'WORK_003',
    WORK_CALC_DAYS_OFF: 'WORK_004',
    WORK_DAY_OFF_CREATE: 'WORK_005',
    WORK_DAY_OFF_LIST: 'WORK_006',
    WORK_DAY_OFF_DELETE: 'WORK_007',
    WORK_PENDING_LIST: 'WORK_008',
    WORK_REVIEW: 'WORK_009',

    // Settings errors (SET_xxx)
    SET_TERMS_GET: 'SET_001',
    SET_TERMS_STATUS: 'SET_002',
    SET_TERMS_UPDATE: 'SET_003',
    SET_TERMS_ACCEPT: 'SET_004',
    SET_TERMS_REPORT: 'SET_005',
    SET_CATEGORY_CREATE: 'SET_006',
    SET_CATEGORY_DELETE: 'SET_007',
    SET_SHIFT_CREATE: 'SET_008',
    SET_SHIFT_UPDATE: 'SET_009',
    SET_SHIFT_DELETE: 'SET_010',
    SET_AVAILABILITY: 'SET_011',

    // System Settings (SYS_xxx)
    SYS_GET: 'SYS_001',
    SYS_UPDATE: 'SYS_002',
    SYS_TOGGLE: 'SYS_003',

    // Dashboard errors (DASH_xxx)
    DASH_RH: 'DASH_001',
    DASH_MASTER: 'DASH_002',

    // Report errors (REP_xxx)
    REP_GENERATE: 'REP_001',

    // Quiz errors (QUIZ_xxx)
    QUIZ_CREATE: 'QUIZ_001',
    QUIZ_DELETE: 'QUIZ_002',
    QUIZ_GET_EDITOR: 'QUIZ_003',
    QUIZ_ADD_QUESTION: 'QUIZ_004',
    QUIZ_DEL_QUESTION: 'QUIZ_005',
    QUIZ_GET: 'QUIZ_006',
    QUIZ_SUBMIT: 'QUIZ_007',

    // Course errors (COURSE_xxx)
    COURSE_CREATE: 'COURSE_001',
    COURSE_LIST: 'COURSE_002',
    COURSE_GET: 'COURSE_003',
    COURSE_UPDATE: 'COURSE_004',
    COURSE_DELETE: 'COURSE_005',
    MODULE_CREATE: 'COURSE_006',
    MODULE_UPDATE: 'COURSE_007',
    MODULE_DELETE: 'COURSE_008',
    LESSON_CREATE: 'COURSE_009',
    LESSON_UPDATE: 'COURSE_010',
    LESSON_DELETE: 'COURSE_011',
    ENROLL: 'COURSE_012',

    // Libras errors (LIBRAS_xxx)
    LIBRAS_CHECK: 'LIBRAS_001',
    LIBRAS_GET_SETTINGS: 'LIBRAS_002',
    LIBRAS_UPDATE_SETTINGS: 'LIBRAS_003',
    LIBRAS_CALL_REQUEST: 'LIBRAS_004',
    LIBRAS_CALL_LIST: 'LIBRAS_005',
    LIBRAS_CALL_STATUS: 'LIBRAS_006',
    LIBRAS_CALL_ACCEPT: 'LIBRAS_007',
    LIBRAS_CALL_UPDATE: 'LIBRAS_008',
    LIBRAS_CALL_INVITE: 'LIBRAS_009',

    // Specialist errors (SPEC_xxx)
    SPEC_LIST: 'SPEC_001',
    SPEC_CREATE: 'SPEC_002',
    SPEC_UPDATE: 'SPEC_003',
    SPEC_DELETE: 'SPEC_004',
    SPECIALTY_LIST: 'SPEC_005',
    SPECIALTY_CREATE: 'SPEC_006',
    SPECIALTY_DELETE: 'SPEC_007',

    // PDI errors (PDI_xxx)
    PDI_CREATE: 'PDI_001',
    PDI_LIST: 'PDI_002',
    PDI_UPDATE: 'PDI_003',
    PDI_DELETE: 'PDI_004',

    // Feed errors (FEED_xxx)
    FEED_CREATE: 'FEED_001',
    FEED_LIST: 'FEED_002',
    FEED_UPDATE: 'FEED_003',
    FEED_DELETE: 'FEED_004',

    // Notification errors (NOTIF_xxx)
    NOTIF_LIST: 'NOTIF_001',
    NOTIF_READ: 'NOTIF_002',
    NOTIF_READ_ALL: 'NOTIF_003',

    // Mediation errors (MED_xxx)
    MED_CREATE: 'MED_001',
    MED_LIST: 'MED_002',
    MED_GET: 'MED_003',
    MED_UPDATE: 'MED_004',
    MED_CONCLUDE: 'MED_005',

    // Complaint errors (COMPL_xxx)
    COMPL_CREATE: 'COMPL_001',
    COMPL_LIST: 'COMPL_002',
    COMPL_GET: 'COMPL_003',
    COMPL_UPDATE: 'COMPL_004',
    COMPL_DELETE: 'COMPL_005',

    // QS Score errors (QS_xxx)
    QS_GET: 'QS_001',
    QS_AREA: 'QS_002',
    QS_RISK: 'QS_003',
    QS_RECALC: 'QS_004',
    QS_SIMULATE: 'QS_005',

    // Indicator errors (IND_xxx)
    IND_DIVERSITY: 'IND_001',
    IND_RETENTION: 'IND_002',
    IND_SECTOR: 'IND_003',
    IND_RISK: 'IND_004',

    // Upload errors (UPL_xxx)
    UPL_CLOUD: 'UPL_001',
    UPL_UNKNOWN: 'UPL_002',

    // Decision errors (DEC_xxx)
    DEC_HISTORY: 'DEC_001',

    // Health errors (HEALTH_xxx)
    HEALTH_CHECK: 'HEALTH_001',

    // AI errors (AI_xxx)
    AI_ANALYZE: 'AI_001',
    AI_ALERTS: 'AI_002',

    // Daily errors (DAILY_xxx)
    DAILY_ROOM: 'DAILY_001',

    // Gamification errors (GAMIF_xxx)
    GAMIF_PROFILE: 'GAMIF_001',
    GAMIF_LEADERBOARD: 'GAMIF_002',
    GAMIF_ACHIEVEMENTS: 'GAMIF_003',

    // Generic
    INTERNAL: 'ERR_500',
    UNKNOWN: 'ERR_999',
} as const;

// Portuguese messages for each error code
export const ERROR_MESSAGES: Record<string, string> = {
    // Auth
    [ERROR_CODES.AUTH_CREATE_USER]: 'Erro ao criar usuário',
    [ERROR_CODES.AUTH_LOGIN]: 'Erro ao fazer login',
    [ERROR_CODES.AUTH_REGISTER_COLLABORATOR]: 'Erro ao registrar colaborador',
    [ERROR_CODES.AUTH_GET_PROFILE]: 'Erro ao buscar perfil do usuário',
    [ERROR_CODES.AUTH_SETUP_2FA]: 'Erro ao configurar autenticação de dois fatores',
    [ERROR_CODES.AUTH_VERIFY_2FA]: 'Erro ao verificar código 2FA',
    [ERROR_CODES.AUTH_DISABLE_2FA]: 'Erro ao desativar autenticação de dois fatores',
    [ERROR_CODES.AUTH_VALIDATION]: 'Erro de validação de autenticação',
    [ERROR_CODES.AUTH_CHECK]: 'Erro ao verificar status da conta',
    [ERROR_CODES.AUTH_LOGOUT]: 'Erro ao fazer logout',

    // User
    [ERROR_CODES.USER_LIST]: 'Erro ao listar usuários',
    [ERROR_CODES.USER_CREATE]: 'Erro ao criar usuário',
    [ERROR_CODES.USER_UPDATE]: 'Erro ao atualizar usuário',
    [ERROR_CODES.USER_DELETE]: 'Erro ao excluir usuário',

    // Collaborator
    [ERROR_CODES.COLAB_LIST]: 'Erro ao listar colaboradores',
    [ERROR_CODES.COLAB_CREATE]: 'Erro ao criar colaborador',
    [ERROR_CODES.COLAB_GET]: 'Erro ao buscar colaborador',
    [ERROR_CODES.COLAB_UPDATE]: 'Erro ao atualizar colaborador',
    [ERROR_CODES.COLAB_DELETE]: 'Erro ao excluir colaborador',

    // Company
    [ERROR_CODES.COMP_STRUCTURE]: 'Erro ao buscar estrutura organizacional',
    [ERROR_CODES.COMP_CREATE]: 'Erro ao criar empresa',
    [ERROR_CODES.COMP_LIST]: 'Erro ao listar empresas',
    [ERROR_CODES.COMP_UPDATE]: 'Erro ao atualizar empresa',
    [ERROR_CODES.COMP_DELETE]: 'Erro ao excluir empresa',
    [ERROR_CODES.SECTOR_CREATE]: 'Erro ao criar setor',
    [ERROR_CODES.SECTOR_LIST]: 'Erro ao listar setores',
    [ERROR_CODES.SECTOR_UPDATE]: 'Erro ao atualizar setor',
    [ERROR_CODES.AREA_CREATE]: 'Erro ao criar área',
    [ERROR_CODES.AREA_LIST]: 'Erro ao listar áreas',
    [ERROR_CODES.AREA_UPDATE]: 'Erro ao atualizar área',

    // Visit
    [ERROR_CODES.VISIT_CREATE]: 'Erro ao registrar visita',
    [ERROR_CODES.VISIT_LIST]: 'Erro ao listar visitas',
    [ERROR_CODES.VISIT_GET]: 'Erro ao buscar visita',
    [ERROR_CODES.VISIT_UPDATE]: 'Erro ao atualizar visita',

    // Pendency
    [ERROR_CODES.PEND_LIST]: 'Erro ao listar pendências',
    [ERROR_CODES.PEND_CREATE]: 'Erro ao criar pendência',
    [ERROR_CODES.PEND_UPDATE]: 'Erro ao atualizar pendência',
    [ERROR_CODES.PEND_DELETE]: 'Erro ao excluir pendência',

    // Schedule
    [ERROR_CODES.SCHED_CREATE]: 'Erro ao criar agendamento',
    [ERROR_CODES.SCHED_LIST]: 'Erro ao listar agendamentos',
    [ERROR_CODES.SCHED_UPDATE]: 'Erro ao atualizar status do agendamento',

    // Work Schedule
    [ERROR_CODES.WORK_GET]: 'Erro ao obter escala de trabalho',
    [ERROR_CODES.WORK_SAVE]: 'Erro ao salvar escala de trabalho',
    [ERROR_CODES.WORK_LIST]: 'Erro ao listar escalas',
    [ERROR_CODES.WORK_CALC_DAYS_OFF]: 'Erro ao calcular folgas',
    [ERROR_CODES.WORK_DAY_OFF_CREATE]: 'Erro ao registrar folga',
    [ERROR_CODES.WORK_DAY_OFF_LIST]: 'Erro ao listar folgas',
    [ERROR_CODES.WORK_DAY_OFF_DELETE]: 'Erro ao remover folga',
    [ERROR_CODES.WORK_PENDING_LIST]: 'Erro ao listar pendências de folgas',
    [ERROR_CODES.WORK_REVIEW]: 'Erro ao processar revisão de folga',

    // Settings
    [ERROR_CODES.SET_TERMS_GET]: 'Erro ao buscar termos de uso',
    [ERROR_CODES.SET_TERMS_STATUS]: 'Erro ao verificar status dos termos',
    [ERROR_CODES.SET_TERMS_UPDATE]: 'Erro ao atualizar termos',
    [ERROR_CODES.SET_TERMS_ACCEPT]: 'Erro ao aceitar termos',
    [ERROR_CODES.SET_TERMS_REPORT]: 'Erro ao gerar relatório de aceites',
    [ERROR_CODES.SET_CATEGORY_CREATE]: 'Erro ao criar categoria',
    [ERROR_CODES.SET_CATEGORY_DELETE]: 'Erro ao excluir categoria',
    [ERROR_CODES.SET_SHIFT_CREATE]: 'Erro ao criar turno',
    [ERROR_CODES.SET_SHIFT_UPDATE]: 'Erro ao atualizar turno',
    [ERROR_CODES.SET_SHIFT_DELETE]: 'Erro ao excluir turno',
    [ERROR_CODES.SET_AVAILABILITY]: 'Erro ao atualizar disponibilidade',

    // System Settings
    [ERROR_CODES.SYS_GET]: 'Erro ao obter configurações do sistema',
    [ERROR_CODES.SYS_UPDATE]: 'Erro ao atualizar configurações do sistema',
    [ERROR_CODES.SYS_TOGGLE]: 'Erro ao alternar funcionalidade',

    // Dashboard
    [ERROR_CODES.DASH_RH]: 'Erro ao carregar dashboard do RH',
    [ERROR_CODES.DASH_MASTER]: 'Erro ao carregar dashboard Master',

    // Report
    [ERROR_CODES.REP_GENERATE]: 'Erro ao gerar relatório',

    // Quiz
    [ERROR_CODES.QUIZ_CREATE]: 'Erro ao criar quiz',
    [ERROR_CODES.QUIZ_DELETE]: 'Erro ao excluir quiz',
    [ERROR_CODES.QUIZ_GET_EDITOR]: 'Erro ao carregar editor do quiz',
    [ERROR_CODES.QUIZ_ADD_QUESTION]: 'Erro ao adicionar questão',
    [ERROR_CODES.QUIZ_DEL_QUESTION]: 'Erro ao excluir questão',
    [ERROR_CODES.QUIZ_GET]: 'Erro ao buscar quiz',
    [ERROR_CODES.QUIZ_SUBMIT]: 'Erro ao enviar respostas do quiz',

    // Course
    [ERROR_CODES.COURSE_CREATE]: 'Erro ao criar curso',
    [ERROR_CODES.COURSE_LIST]: 'Erro ao listar cursos',
    [ERROR_CODES.COURSE_GET]: 'Erro ao buscar curso',
    [ERROR_CODES.COURSE_UPDATE]: 'Erro ao atualizar curso',
    [ERROR_CODES.COURSE_DELETE]: 'Erro ao excluir curso',
    [ERROR_CODES.MODULE_CREATE]: 'Erro ao criar módulo',
    [ERROR_CODES.MODULE_UPDATE]: 'Erro ao atualizar módulo',
    [ERROR_CODES.MODULE_DELETE]: 'Erro ao excluir módulo',
    [ERROR_CODES.LESSON_CREATE]: 'Erro ao criar lição',
    [ERROR_CODES.LESSON_UPDATE]: 'Erro ao atualizar lição',
    [ERROR_CODES.LESSON_DELETE]: 'Erro ao excluir lição',
    [ERROR_CODES.ENROLL]: 'Erro ao realizar matrícula',

    // Libras
    [ERROR_CODES.LIBRAS_CHECK]: 'Erro ao verificar disponibilidade de Libras',
    [ERROR_CODES.LIBRAS_GET_SETTINGS]: 'Erro ao obter configurações de Libras',
    [ERROR_CODES.LIBRAS_UPDATE_SETTINGS]: 'Erro ao atualizar configurações de Libras',
    [ERROR_CODES.LIBRAS_CALL_REQUEST]: 'Erro ao solicitar chamada de Libras',
    [ERROR_CODES.LIBRAS_CALL_LIST]: 'Erro ao listar chamadas pendentes',
    [ERROR_CODES.LIBRAS_CALL_STATUS]: 'Erro ao verificar status da chamada',
    [ERROR_CODES.LIBRAS_CALL_ACCEPT]: 'Erro ao aceitar chamada',
    [ERROR_CODES.LIBRAS_CALL_UPDATE]: 'Erro ao atualizar status da chamada',
    [ERROR_CODES.LIBRAS_CALL_INVITE]: 'Erro ao convidar para chamada',

    // Specialist
    [ERROR_CODES.SPEC_LIST]: 'Erro ao listar especialistas',
    [ERROR_CODES.SPEC_CREATE]: 'Erro ao criar especialista',
    [ERROR_CODES.SPEC_UPDATE]: 'Erro ao atualizar especialista',
    [ERROR_CODES.SPEC_DELETE]: 'Erro ao excluir especialista',
    [ERROR_CODES.SPECIALTY_LIST]: 'Erro ao listar especialidades',
    [ERROR_CODES.SPECIALTY_CREATE]: 'Erro ao criar especialidade',
    [ERROR_CODES.SPECIALTY_DELETE]: 'Erro ao excluir especialidade',

    // PDI
    [ERROR_CODES.PDI_CREATE]: 'Erro ao criar PDI',
    [ERROR_CODES.PDI_LIST]: 'Erro ao listar PDIs',
    [ERROR_CODES.PDI_UPDATE]: 'Erro ao atualizar PDI',
    [ERROR_CODES.PDI_DELETE]: 'Erro ao excluir PDI',

    // Feed
    [ERROR_CODES.FEED_CREATE]: 'Erro ao criar publicação',
    [ERROR_CODES.FEED_LIST]: 'Erro ao listar publicações',
    [ERROR_CODES.FEED_UPDATE]: 'Erro ao atualizar publicação',
    [ERROR_CODES.FEED_DELETE]: 'Erro ao excluir publicação',

    // Notification
    [ERROR_CODES.NOTIF_LIST]: 'Erro ao buscar notificações',
    [ERROR_CODES.NOTIF_READ]: 'Erro ao marcar notificação como lida',
    [ERROR_CODES.NOTIF_READ_ALL]: 'Erro ao marcar todas notificações como lidas',

    // Mediation
    [ERROR_CODES.MED_CREATE]: 'Erro ao criar mediação',
    [ERROR_CODES.MED_LIST]: 'Erro ao listar mediações',
    [ERROR_CODES.MED_GET]: 'Erro ao buscar mediação',
    [ERROR_CODES.MED_UPDATE]: 'Erro ao atualizar mediação',
    [ERROR_CODES.MED_CONCLUDE]: 'Erro ao concluir mediação',

    // Complaint
    [ERROR_CODES.COMPL_CREATE]: 'Erro ao criar reclamação',
    [ERROR_CODES.COMPL_LIST]: 'Erro ao listar reclamações',
    [ERROR_CODES.COMPL_GET]: 'Erro ao buscar reclamação',
    [ERROR_CODES.COMPL_UPDATE]: 'Erro ao atualizar reclamação',
    [ERROR_CODES.COMPL_DELETE]: 'Erro ao excluir reclamação',

    // QS Score
    [ERROR_CODES.QS_GET]: 'Erro ao obter QS Score',
    [ERROR_CODES.QS_AREA]: 'Erro ao obter score da área',
    [ERROR_CODES.QS_RISK]: 'Erro ao obter mapa de risco',
    [ERROR_CODES.QS_RECALC]: 'Erro ao recalcular scores',
    [ERROR_CODES.QS_SIMULATE]: 'Erro ao simular impacto',

    // Indicators
    [ERROR_CODES.IND_DIVERSITY]: 'Erro ao obter censo de diversidade',
    [ERROR_CODES.IND_RETENTION]: 'Erro ao obter taxa de retenção',
    [ERROR_CODES.IND_SECTOR]: 'Erro ao obter comparativo entre setores',
    [ERROR_CODES.IND_RISK]: 'Erro ao obter radar de risco',

    // Upload
    [ERROR_CODES.UPL_CLOUD]: 'Erro ao fazer upload para o serviço de nuvem',
    [ERROR_CODES.UPL_UNKNOWN]: 'Erro desconhecido durante upload',

    // Decision
    [ERROR_CODES.DEC_HISTORY]: 'Erro ao obter histórico de decisões',

    // Health
    [ERROR_CODES.HEALTH_CHECK]: 'Erro ao verificar saúde do sistema',

    // AI
    [ERROR_CODES.AI_ANALYZE]: 'Erro ao analisar padrões com IA',
    [ERROR_CODES.AI_ALERTS]: 'Erro ao obter alertas inteligentes',

    // Daily
    [ERROR_CODES.DAILY_ROOM]: 'Erro ao criar sala de videoconferência',

    // Gamification
    [ERROR_CODES.GAMIF_PROFILE]: 'Erro ao buscar perfil de gamificação',
    [ERROR_CODES.GAMIF_LEADERBOARD]: 'Erro ao buscar placar de líderes',
    [ERROR_CODES.GAMIF_ACHIEVEMENTS]: 'Erro ao buscar conquistas',

    // Generic
    [ERROR_CODES.INTERNAL]: 'Erro interno do servidor',
    [ERROR_CODES.UNKNOWN]: 'Erro inesperado do sistema',
};

/**
 * Send a standardized 500 error response
 */
export const sendError500 = (
    res: Response,
    code: string,
    error?: Error | unknown
): void => {
    const message = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.INTERNAL];

    // Log the actual error for debugging (server-side only)
    if (error) {
        console.error(`[${code}] ${message}:`, error instanceof Error ? error.message : error);
    }

    const response: ApiError = {
        code,
        message,
    };

    // Include error details in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        response.details = error.message;
    }

    res.status(500).json(response);
};

/**
 * Create an error handler for a specific error code
 * Usage: catch (error) { handleError(res, ERROR_CODES.USER_LIST, error); }
 */
export const handleError = sendError500;
