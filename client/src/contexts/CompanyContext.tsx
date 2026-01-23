import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Company {
    id: string;
    name: string;
    cnpj: string;
    logo?: string;
    universityEnabled?: boolean;
    talentManagementEnabled?: boolean;
    systemSettings?: {
        rhCanSeeQSScore?: boolean;
        rhCanSeeRiskMap?: boolean;
        rhCanSeeAlerts?: boolean;
        complaintsEnabled?: boolean;
        mediationsEnabled?: boolean;
        qsScoreEnabled?: boolean;
        aiAlertsEnabled?: boolean;
        riskMapEnabled?: boolean;
        workScheduleEnabled?: boolean;
    };
}

interface CompanyContextType {
    companies: Company[];
    selectedCompanyId: string | null;
    selectCompany: (id: string) => void;
    loading: boolean;
    error: string | null;
    apiUrl: string;
    refreshCompanies: () => void;
    company?: Company;
}

const CompanyContext = createContext<CompanyContextType>({
    companies: [],
    selectedCompanyId: null,
    selectCompany: () => { },
    loading: true,
    error: null,
    apiUrl: '',
    refreshCompanies: () => { }
});

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(localStorage.getItem('selectedCompanyId'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (!apiUrl) console.warn('CompanyContext: VITE_API_URL missing');

    const fetchCompanies = async () => {
        // Don't fetch if no token (public routes)
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/companies');
            const data = response.data;

            if (Array.isArray(data)) {
                setCompanies(data);
            } else if (data && Array.isArray(data.data)) {
                setCompanies(data.data);
            } else {
                console.error('Invalid companies data format:', data);
                setCompanies([]);
            }
        } catch (error) {
            console.error('Error fetching companies for context', error);
            // Don't set global error for auth failures to avoid breaking public pages
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage !== 'Sessão expirada') {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();

        // Poll for company updates (e.g., settings changes like universityEnabled)
        const interval = setInterval(() => {
            if (localStorage.getItem('token')) {
                fetchCompanies();
            }
        }, 30000); // Check every 30s

        return () => clearInterval(interval);
    }, []);

    const refreshCompanies = () => {
        fetchCompanies();
    };

    const selectCompany = (id: string) => {
        if (id === "") {
            setSelectedCompanyId(null);
            localStorage.removeItem('selectedCompanyId');
        } else {
            setSelectedCompanyId(id);
            localStorage.setItem('selectedCompanyId', id);
        }
        // window.location.reload(); // Removed reload to allow reactive updates
    };

    const company = companies.find(c => c.id === selectedCompanyId);

    return (
        <CompanyContext.Provider value={{ companies, selectedCompanyId, selectCompany, loading, error, apiUrl, refreshCompanies, company }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
