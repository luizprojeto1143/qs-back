import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, Calendar, Search, Filter } from 'lucide-react';

interface Company {
    id: string;
    name: string;
    cnpj: string;
    active: boolean;
    createdAt: string;
    deletedAt?: string;
}

const CompanyHistory = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompanies = async () => {
        try {
            // We need an endpoint that returns ALL companies, including inactive ones
            // Currently listCompanies filters by active=true. 
            // We might need to update listCompanies to accept a query param 'includeInactive=true'
            // For now, let's assume we updated the backend or use a new endpoint.
            // Let's try passing a query param to the existing endpoint if we modified it, 
            // or we need to modify the backend first.
            // Wait, I modified listCompanies to filter active=true by default.
            // I should update listCompanies to allow filtering.

            const response = await api.get('/companies?includeInactive=true');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies', error);
            toast.error('Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.cnpj.includes(searchTerm);
        const matchesStatus = showInactive ? true : company.active;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="text-gray-500">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Empresas</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Visualize o histórico de todas as empresas, incluindo as inativas.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 w-full"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showInactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="showInactive" className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrar Inativas
                    </label>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredCompanies.map(company => (
                    <div key={company.id} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border ${company.active ? 'border-gray-100 dark:border-gray-700' : 'border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-lg ${company.active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {company.name}
                                        {!company.active && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-300">
                                                Inativa
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">CNPJ: {company.cnpj}</p>

                                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>Criada em: {format(new Date(company.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                                        </div>
                                        {company.deletedAt && (
                                            <div className="flex items-center gap-1 text-red-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>Desativada em: {format(new Date(company.deletedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions or Stats could go here */}
                        </div>
                    </div>
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        Nenhuma empresa encontrada.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyHistory;
