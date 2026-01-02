import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Filter, Plus, X, User, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCompany } from '../contexts/CompanyContext';
import { api } from '../lib/api';

const Pendencies = () => {
    const { selectedCompanyId, companies: contextCompanies } = useCompany();
    const [searchParams] = useSearchParams();

    const [pendencies, setPendencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Dropdown Data
    const [companies, setCompanies] = useState<any[]>(contextCompanies);
    const [areas, setAreas] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        priority: searchParams.get('priority') || '',
        responsible: '',
        areaId: searchParams.get('areaId') || ''
    });

    const [showFilters, setShowFilters] = useState(!!searchParams.get('areaId')); // Auto-open filters if areaId is present

    const [newPendency, setNewPendency] = useState({
        description: '',
        responsible: '',
        priority: 'MEDIA',
        deadline: '',
        companyId: selectedCompanyId || '',
        areaId: '',
        collaboratorId: ''
    });

    // Update newPendency when selectedCompanyId changes
    useEffect(() => {
        if (selectedCompanyId) {
            setNewPendency(prev => ({ ...prev, companyId: selectedCompanyId }));
        }
    }, [selectedCompanyId]);

    const fetchData = async () => {
        try {
            const [resPendencies, resCompanies, resAreas] = await Promise.all([
                api.get('/pendencies'),
                api.get('/companies'),
                api.get('/areas'),
            ]);

            setPendencies(resPendencies.data);
            setCompanies(resCompanies.data);
            setAreas(resAreas.data);

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
            const url = editingId ? `/pendencies/${editingId}` : '/pendencies';
            const method = editingId ? 'put' : 'post';

            await api[method](url, newPendency);

            setIsModalOpen(false);
            setNewPendency({
                description: '', responsible: '', priority: 'MEDIA', deadline: '',
                companyId: selectedCompanyId || '', areaId: '', collaboratorId: ''
            });
            setEditingId(null);
            fetchData();
            toast.success(editingId ? 'Pendência atualizada com sucesso!' : 'Pendência registrada com sucesso!');
        } catch (error) {
            console.error('Error saving pendency', error);
            toast.error('Erro ao salvar pendência.');
        }
    };

    const handleEdit = (item: any) => {
        setNewPendency({
            description: item.description,
            responsible: item.responsible,
            priority: item.priority,
            deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
            companyId: item.companyId,
            areaId: item.areaId || '',
            collaboratorId: item.collaboratorId || ''
        });
        setEditingId(item.id);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta pendência?')) return;
        try {
            await api.delete(`/pendencies/${id}`);
            fetchData();
            toast.success('Pendência excluída com sucesso!');
        } catch (error) {
            console.error('Error deleting pendency', error);
            toast.error('Erro ao excluir pendência.');
        }
        setActiveMenuId(null);
    };

    const handleResolve = async (id: string) => {
        if (!confirm('Marcar pendência como resolvida?')) return;
        try {
            await api.put(`/pendencies/${id}`, { status: 'RESOLVIDA' });
            fetchData();
            toast.success('Pendência resolvida!');
        } catch (error) {
            console.error('Error resolving pendency', error);
            toast.error('Erro ao resolver pendência.');
        }
    };

    const filteredPendencies = (Array.isArray(pendencies) ? pendencies : []).filter(p => {
        const matchesStatus = !filters.status || p.status === filters.status;
        const matchesPriority = !filters.priority || p.priority === filters.priority;
        const matchesResponsible = !filters.responsible || (p.responsible && p.responsible.toLowerCase().includes(filters.responsible.toLowerCase()));
        const matchesArea = !filters.areaId || p.areaId === filters.areaId;
        return matchesStatus && matchesPriority && matchesResponsible && matchesArea;
    });

    return (
        <div className="space-y-6" onClick={() => setActiveMenuId(null)}>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Pendências</h1>
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-gray-200' : ''}`}
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filtrar</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                            setEditingId(null);
                            setNewPendency({
                                description: '', responsible: '', priority: 'MEDIA', deadline: '',
                                companyId: selectedCompanyId || '', areaId: '', collaboratorId: ''
                            });
                        }}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nova Pendência</span>
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="input-field"
                            value={filters.status}
                            onChange={e => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Todos</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="RESOLVIDA">Resolvida</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                        <select
                            className="input-field"
                            value={filters.priority}
                            onChange={e => setFilters({ ...filters, priority: e.target.value })}
                        >
                            <option value="">Todas</option>
                            <option value="BAIXA">Baixa</option>
                            <option value="MEDIA">Média</option>
                            <option value="ALTA">Alta</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                        <select
                            className="input-field"
                            value={filters.areaId}
                            onChange={e => setFilters({ ...filters, areaId: e.target.value })}
                        >
                            <option value="">Todas</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Buscar por nome..."
                            value={filters.responsible}
                            onChange={e => setFilters({ ...filters, responsible: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : filteredPendencies.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma pendência encontrada</h3>
                    <p className="text-gray-500">Tente ajustar os filtros ou adicione uma nova pendência.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredPendencies.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors relative">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-lg ${item.priority === 'ALTA' ? 'bg-red-50 text-red-600' :
                                            item.priority === 'MEDIA' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-blue-50 text-blue-600'
                                            }`}>
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.description}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    {item.responsible}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                                </span>
                                                {item.area && (
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                        {item.area.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.status === 'RESOLVIDA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                        {item.status !== 'RESOLVIDA' && (
                                            <button
                                                type="button"
                                                onClick={() => handleResolve(item.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Resolver"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                        )}

                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>

                                            {activeMenuId === item.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Pendência' : 'Nova Pendência'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    required
                                    className="input-field"
                                    rows={3}
                                    value={newPendency.description}
                                    onChange={e => setNewPendency({ ...newPendency, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newPendency.responsible}
                                        onChange={e => setNewPendency({ ...newPendency, responsible: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newPendency.deadline}
                                        onChange={e => setNewPendency({ ...newPendency, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select
                                        className="input-field"
                                        value={newPendency.priority}
                                        onChange={e => setNewPendency({ ...newPendency, priority: e.target.value })}
                                    >
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área (Opcional)</label>
                                    <select
                                        className="input-field"
                                        value={newPendency.areaId}
                                        onChange={e => setNewPendency({ ...newPendency, areaId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <select
                                    required
                                    className={`input-field ${selectedCompanyId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    value={newPendency.companyId}
                                    onChange={e => setNewPendency({ ...newPendency, companyId: e.target.value })}
                                    disabled={!!selectedCompanyId}
                                >
                                    <option value="">Selecione...</option>
                                    {(companies.length > 0 ? companies : contextCompanies).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingId ? 'Salvar Alterações' : 'Salvar Pendência'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pendencies;
