export interface Company {
    id: string;
    name: string;
    cnpj?: string;
    active: boolean;
    universityEnabled?: boolean;
}

export interface Sector {
    id: string;
    name: string;
    companyId: string;
    company?: Company;
}

export interface Area {
    id: string;
    name: string;
    sectorId: string;
    sector?: Sector;
}
