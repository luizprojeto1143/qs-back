import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Company {
    id: string;
    name: string;
    cnpj: string;
    logo?: string;
    universityEnabled?: boolean;
    systemSettings?: {
        rhCanSeeQSScore?: boolean;
        rhCanSeeRiskMap?: boolean;
        complaintsEnabled?: boolean;
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
        } catch (error: any) {
            console.error('Error fetching companies for context', error);
            // Don't set global error for auth failures to avoid breaking public pages
            if (error.message !== 'Sessão expirada') {
                setError(error.message || 'Unknown error');
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

    return (
        <CompanyContext.Provider value={{ companies, selectedCompanyId, selectCompany, loading, error, apiUrl, refreshCompanies }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
