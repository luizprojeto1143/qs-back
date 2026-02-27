export interface Pendency {
    id?: string;
    description: string;
    responsible: string;
    priority: 'BAIXA' | 'MEDIA' | 'ALTA' | string;
    deadline: string;
    status?: 'PENDENTE' | 'RESOLVIDA' | 'CONCLUIDA';
    createdAt?: string;
}

export interface Attachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface VisitFormData {
    companyId: string;
    areaId: string;
    collaboratorIds: string[];
    relatos: {
        lideranca: string;
        colaborador: string;
        consultoria: string;
        observacoes: string;
        audioLideranca: string | null;
        audioColaborador: string | null;
    };
    avaliacoes: {
        area: Record<string, number>;
        lideranca: Record<string, number>;
        colaborador: Record<string, number>;
    };
    pendencias: Pendency[];
    anexos: Attachment[];
}

export interface IndividualNote {
    id?: string;
    collaboratorId: string;
    content: string;
    collaborator?: {
        user: {
            name: string;
        };
    };
    createdAt?: string;
}

export interface Visit {
    id: string;
    date: string;
    areaId?: string;
    companyId: string;
    area?: {
        name: string;
        sector?: {
            name: string;
        };
    };
    master?: {
        name: string;
    };
    observacoesMaster?: string;
    relatoColaborador?: string;
    relatoLideranca?: string;
    relatoConsultoria?: string;
    notes?: IndividualNote[];
    generatedPendencies?: Pendency[];
    collaborators?: Array<{
        id: string;
        user: {
            name: string;
            email?: string;
            avatar?: string;
        };
        matricula?: string;
        shift?: string;
    }>;
    attachments?: Attachment[];
}
