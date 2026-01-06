import { useState, useEffect } from 'react';
import { Layers, Plus, X } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/EmptyState';
import type { Sector, Company } from '../../types/organization';

const SectorsList = () => {
    const { selectedCompanyId, companies: contextCompanies } = useCompany();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [companies, setCompanies] = useState<Company[]>(contextCompanies);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newSector, setNewSector] = useState({ name: '', companyId: selectedCompanyId || '' });

    // Update newSector when selectedCompanyId changes
    useEffect(() => {
        if (selectedCompanyId) {
            setNewSector(prev => ({ ...prev, companyId: selectedCompanyId }));
        }
    }, [selectedCompanyId]);

    const fetchData = async () => {
        try {
            // Use context companies if available, otherwise fetch
            if (contextCompanies.length > 0) {
                setCompanies(contextCompanies);
            } else {
                const resCompanies = await api.get('/companies');
                setCompanies(resCompanies.data);
            }

            const resSectors = await api.get('/sectors');
            // Assuming the API returns a list of sectors
            const sectorsData = Array.isArray(resSectors.data) ? resSectors.data : (resSectors.data?.data || []);
            setSectors(sectorsData);

        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [contextCompanies, selectedCompanyId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/sectors/${editingId}` : '/sectors';
            const method = editingId ? 'put' : 'post';

            await api[method](url, newSector);

            setIsModalOpen(false);
            setNewSector({ name: '', companyId: selectedCompanyId || '' });
            setEditingId(null);
            fetchData();
            alert(editingId ? 'Setor atualizado com sucesso!' : 'Setor cadastrado com sucesso!');
        } catch (error: any) {
            console.error('Error saving sector', error);
            alert(error.message || 'Erro ao salvar setor.');
        }
    };

    const handleEdit = (sector: Sector) => {
        setNewSector({
            name: sector.name,
            companyId: sector.companyId
        });
        setEditingId(sector.id);
        setIsModalOpen(true);
    };

    // Filter sectors based on selectedCompanyId
    const filteredSectors = sectors.filter(sector => !selectedCompanyId || sector.companyId === selectedCompanyId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Setores</h1>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Novo Setor</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">Carregando...</div>
            ) : filteredSectors.length === 0 ? (
                <EmptyState
                    title="Nenhum setor encontrado"
                    description="Defina os setores da organização para agrupar as áreas e colaboradores."
                    icon={Layers}
                    action={{
                        label: 'Novo Setor',
                        onClick: () => setIsModalOpen(true)
                    }}
                />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome do Setor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredSectors.map((sector) => (
                                    <tr key={sector.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                                    <Layers className="h-5 w-5" />
                                                </div>
                                                <span>{sector.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {sector.company?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button type="button" onClick={() => handleEdit(sector)} className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Editar Setor' : 'Novo Setor'}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Fechar modal">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                                <select
                                    required
                                    className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white ${selectedCompanyId ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                                    value={newSector.companyId}
                                    onChange={e => setNewSector({ ...newSector, companyId: e.target.value })}
                                    disabled={!!selectedCompanyId}
                                >
                                    <option value="">Selecione...</option>
                                    {Array.isArray(companies) && companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Setor</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newSector.name}
                                    onChange={e => setNewSector({ ...newSector, name: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectorsList;
