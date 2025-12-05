import React, { createContext, useContext, useState, useEffect } from 'react';

interface Company {
    id: string;
    name: string;
    cnpj: string;
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/companies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCompanies(data);
                    // Removed auto-selection to allow for Global (null) context
                    // if (data.length > 0) {
                    //     if (!selectedCompanyId || !data.find((c: Company) => c.id === selectedCompanyId)) {
                    //         const firstId = data[0].id;
                    //         setSelectedCompanyId(firstId);
                    //         localStorage.setItem('selectedCompanyId', firstId);
                    //     }
                    // }
                } else {
                    console.error('Invalid companies data format:', data);
                    setCompanies([]);
                }
            } else {
                setError(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('Error fetching companies for context', error);
            setError(error.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
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
