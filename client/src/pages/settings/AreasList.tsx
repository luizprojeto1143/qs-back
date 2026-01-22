import { useState, useEffect } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/EmptyState';
import { toast } from 'sonner';
import type { Area, Sector } from '../../types/organization';

const AreasList = () => {
    const { selectedCompanyId } = useCompany();
    const [areas, setAreas] = useState<Area[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newArea, setNewArea] = useState({ name: '', sectorId: '' });

    const fetchData = async () => {
        try {
            const [resAreas, resSectors] = await Promise.all([
                api.get('/areas'),
                api.get('/sectors')
            ]);

            setAreas(resAreas.data);
            setSectors(resSectors.data);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompanyId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/areas/${editingId}` : '/areas';
            const method = editingId ? 'put' : 'post';

            await api[method](url, newArea);

            setIsModalOpen(false);
            setNewArea({ name: '', sectorId: '' });
            setEditingId(null);
            fetchData();
            toast.success(editingId ? 'Área atualizada com sucesso!' : 'Área cadastrada com sucesso!');
        } catch (error) {
            console.error('Error saving area', error);
            const err = error as { message?: string };
            toast.error(err.message || 'Erro ao salvar área.');
        }
    };

    const handleEdit = (area: Area) => {
        setNewArea({
            name: area.name,
            sectorId: area.sectorId
        });
        setEditingId(area.id);
        setIsModalOpen(true);
    };

    // Filter sectors based on selectedCompanyId (if set)
    const filteredSectors = sectors.filter(sector => !selectedCompanyId || sector.companyId === selectedCompanyId);

    // Filter areas based on filtered sectors
    const filteredAreas = areas.filter(area => {
        if (!selectedCompanyId) return true;
        const sector = sectors.find(s => s.id === area.sectorId);
        return sector && sector.companyId === selectedCompanyId;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Áreas</h1>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nova Área</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">Carregando...</div>
            ) : filteredAreas.length === 0 ? (
                <EmptyState
                    title="Nenhuma área encontrada"
                    description="Cadastre as áreas da empresa para organizar melhor os colaboradores e visitas."
                    icon={MapPin}
                    action={{
                        label: 'Nova Área',
                        onClick: () => setIsModalOpen(true)
                    }}
                />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome da Área</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Setor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredAreas.map((area) => (
                                    <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <span>{area.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{area.sector?.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {area.sector?.company?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button type="button" onClick={() => handleEdit(area)} className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">Editar</button>
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Editar Área' : 'Nova Área'}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Fechar modal">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                                <select
                                    required
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newArea.sectorId}
                                    onChange={e => setNewArea({ ...newArea, sectorId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {filteredSectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Área</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newArea.name}
                                    onChange={e => setNewArea({ ...newArea, name: e.target.value })}
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

export default AreasList;
