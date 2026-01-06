export interface Complaint {
    id: string;
    type: string;
    content?: string;
    videoUrl?: string;
    translation?: string;
    category?: string;
    severity: string;
    status: string;
    confidentiality: string;
    area?: { name: string };
    reporter?: { name: string };
    validatedBy?: { name: string };
    createdAt: string;
    updatedAt: string;
    resolution?: string;
    resolvedAt?: string;
}
