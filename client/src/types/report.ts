import type { Complaint } from './complaint';
import type { Visit, Pendency, Attachment } from './visit';

export interface ReportStats {
    totalVisits: number;
    totalPendencies: number;
    activeCollaborators?: number;
    totalComplaints?: number;
    resolvedComplaints?: number;
}

export interface AreaMetric {
    id: string;
    name: string;
    sector?: { name: string };
}

export interface ReportMetric {
    label: string;
    value: string | number;
}

export interface ReportData {
    // Shared / Common
    stats?: ReportStats;
    visits?: Visit[];
    complaints?: Complaint[];
    pendencies?: Pendency[];

    // Monthly / Executive
    metrics?: ReportMetric[] | { totalVisits: number; resolutionRate: string | number; satisfaction: string };
    details?: string;
    opportunities?: string;

    // Area / Sector
    area?: {
        id: string;
        name: string;
        sector?: { name: string };
    };
    areas?: AreaMetric[];
    sector?: {
        name: string;
    };

    // Leadership
    groupedData?: Record<string, Record<string, Array<{ score: number }>>>;

    // Evolution
    areaName?: string;
    month?: number;
    year?: number;
    chartData?: Array<{ name: string; score: number }>;
    strengths?: string[];
    weaknesses?: string[];

    // Collaborator History
    collaborator?: {
        id: string;
        matricula?: string;
        shift?: string;
        area?: { name: string };
        user: {
            name: string;
            email: string;
            avatar?: string;
        };
    };

    // Individual Visit Details
    date?: string;
    master?: { name: string };
    company?: { name: string };
    relatoLideranca?: string;
    relatoColaborador?: string;
    relatoConsultoria?: string;
    collaborators?: Array<{
        id: string;
        user: { name: string };
        matricula?: string;
        shift?: string;
    }>;
    notes?: any[]; // Already in Visit but sometimes top-level in reportData
    generatedPendencies?: Pendency[];
    attachments?: Attachment[];

    // Inclusion Diagnosis
    categories?: Record<string, { score: number; notes: string }>;
}
