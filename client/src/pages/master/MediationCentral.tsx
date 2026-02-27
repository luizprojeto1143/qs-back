import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DecisionTimeline from '../../components/qs/DecisionTimeline';
import {
    Scale,
    Plus,
    X,
    Search,
    Calendar,
    User,
    FileText,
    CheckCircle,
    Gavel,
    ChevronDown,
    ChevronUp,
    Building2,
    Users
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useCompany } from '../../contexts/CompanyContext';

interface Collaborator {
    id: string; // User ID
    name: string;
    role: string;
    collaboratorProfile?: {
        area: { id: string; name: string };
    };
}

interface Participant {
    id: string;
    name: string;
    role: string;
    area?: string;
}

interface Mediation {
    id: string;
    theme: string;
    description: string;
    date: string;
    result: string;
    confidentiality: string;
    participants: Participant[] | number;
    leader?: { name: string };
    area?: { id: string; name: string };
}

interface Area {
    id: string;
    name: string;
}

const MediationCentral = () => {
    const { selectedCompanyId } = useCompany();
    const [searchParams] = useSearchParams();

    const [mediations, setMediations] = useState<Mediation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Data for selects
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        startDate: '',
        endDate: '',
        search: ''
    });

    // New/Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        theme: '',
        description: '',
        participants: [] as Participant[], // Now storing objects
        leaderId: '',
        areaId: '',
        confidentiality: 'RESTRITO',
        notes: ''
    });

    const loadMediations = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await api.get(`/mediations/${selectedCompanyId}?${params.toString()}`);
            setMediations(res.data);
        } catch (error) {
            console.error('Error loading mediations:', error);
            toast.error('Erro ao carregar mediações');
        } finally {
            setLoading(false);
        }
    };

    const loadResources = async () => {
        if (!selectedCompanyId) return;
        try {
            const [collabRes, areaRes] = await Promise.all([
                api.get('/collaborators'),
                api.get(`/areas/company/${selectedCompanyId}`) // Assuming this endpoint exists, matching naming convention
            ]).catch(async () => {
                // Fallback if Promise.all fails 
                const c = await api.get('/collaborators');
                // Try to find areas endpoint if above fails? Or just ignore
                return [c, { data: [] }];
            });

            // Adjust based on actual API response structure
            setCollaborators(collabRes.data.data || collabRes.data);

            // If areas endpoint fails, we extract areas from collaborators
            if (!areaRes || !areaRes.data || areaRes.data.length === 0) {
                const extractedAreas = new Map();
                (collabRes.data.data || collabRes.data).forEach((c: { collaboratorProfile?: { area: Area } }) => {
                    if (c.collaboratorProfile?.area) {
                        extractedAreas.set(c.collaboratorProfile.area.id, c.collaboratorProfile.area);
                    }
                });
                setAreas(Array.from(extractedAreas.values()));
            } else {
                setAreas(areaRes.data);
            }

        } catch (error) {
            console.error('Error loading resources:', error);
        }
    };

    useEffect(() => {
        loadMediations();
    }, [selectedCompanyId, filters.status, filters.startDate, filters.endDate]);

    // Load resources when modal opens
    useEffect(() => {
        if (isModalOpen) {
            loadResources();
        }
    }, [isModalOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                companyId: selectedCompanyId,
                date: new Date(formData.date).toISOString()
            };

            if (editingId) {
                await api.put(`/mediation/${editingId}`, payload);
                toast.success('Mediação atualizada!');
            } else {
                await api.post('/mediations', payload);
                toast.success('Mediação registrada!');
            }

            setIsModalOpen(false);
            resetForm();
            loadMediations();
        } catch (error) {
            console.error('Error saving mediation:', error);
            toast.error('Erro ao salvar mediação');
        }
    };

    const handleConclude = async (id: string, result: string) => {
        try {
            await api.patch(`/mediation/${id}/conclude`, {
                result,
                resultDetails: `Concluído manualmente via painel em ${new Date().toLocaleDateString()}`
            });
            toast.success('Mediação concluída!');
            loadMediations();
        } catch (error) {
            toast.error('Erro ao concluir mediação');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            theme: '',
            description: '',
            participants: [],
            leaderId: '',
            areaId: '',
            confidentiality: 'RESTRITO',
            notes: ''
        });
    };

    const addParticipant = (collaboratorId: string) => {
        const collab = collaborators.find(c => c.id === collaboratorId);
        if (collab && !formData.participants.find(p => p.id === collab.id)) {
            setFormData(prev => ({
                ...prev,
                participants: [...prev.participants, {
                    id: collab.id,
                    name: collab.name,
                    role: collab.role,
                    area: collab.collaboratorProfile?.area?.name
                }]
            }));
        }
    };

    const removeParticipant = (id: string) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.id !== id)
        }));
    };

    const filteredList = mediations.filter(m =>
        m.theme.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.description?.toLowerCase().includes(filters.search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in text-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Scale className="w-8 h-8 text-indigo-600" />
                        Central de Mediação
                    </h1>
                    <p className="text-gray-500">Gerencie conflitos e registros de mediação corporativa</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nova Mediação
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Buscar</label>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tema ou descrição..."
                            className="input-field pl-9"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                    <select
                        className="input-field min-w-[150px]"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Todos</option>
                        <option value="PENDENTE">Pendentes</option>
                        <option value="ACORDO">Acordo</option>
                        <option value="SEM_ACORDO">Sem Acordo</option>
                        <option value="ENCAMINHAMENTO">Encaminhado</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Período</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="input-field"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <input
                            type="date"
                            className="input-field"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : filteredList.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center border-2 border-dashed border-gray-200">
                    <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma mediação encontrada</h3>
                    <p className="text-gray-500">Registre a primeira mediação para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredList.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                            {/* Status Badge */}
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.result === 'ACORDO' ? 'bg-green-100 text-green-800' :
                                    item.result === 'SEM_ACORDO' ? 'bg-red-100 text-red-800' :
                                        item.result === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                    }`}>
                                    {item.result.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Gavel className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.theme}</h3>
                                    <p className="text-gray-600 mb-4">{item.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {Array.isArray(item.participants)
                                                ? item.participants.map((p) => (p as Participant).name || p).join(', ')
                                                : item.participants || 0}
                                        </span>
                                        {item.leader && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                Líder: {item.leader.name}
                                            </span>
                                        )}
                                        {item.area && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-4 h-4" />
                                                {item.area.name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            {item.confidentiality}
                                        </span>
                                    </div>

                                    {/* Action Buttons if Pending */}
                                    {item.result === 'PENDENTE' && (
                                        <div className="flex gap-2 mt-2 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => handleConclude(item.id, 'ACORDO')}
                                                className="btn-xs bg-green-50 text-green-700 hover:bg-green-100 border-none px-3 py-1 rounded"
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Acordo
                                            </button>
                                            <button
                                                onClick={() => handleConclude(item.id, 'SEM_ACORDO')}
                                                className="btn-xs bg-red-50 text-red-700 hover:bg-red-100 border-none px-3 py-1 rounded"
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Sem Acordo
                                            </button>
                                            <button
                                                onClick={() => handleConclude(item.id, 'ENCAMINHAMENTO')}
                                                className="btn-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 rounded"
                                            >
                                                <FileText className="w-3 h-3 mr-1" />
                                                Encaminhar RH
                                            </button>
                                        </div>
                                    )}

                                    {/* Timeline Toggle */}
                                    {item.id && (
                                        <button
                                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mt-4 font-medium transition-colors"
                                        >
                                            {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            {expandedId === item.id ? 'Ocultar Histórico' : 'Ver Histórico Jurídico'}
                                        </button>
                                    )}

                                    {expandedId === item.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <DecisionTimeline entityType="MEDIATION" entityId={item.id} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Editar Mediação' : 'Nova Mediação'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field w-full"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sigilo</label>
                                    <select
                                        className="input-field w-full"
                                        value={formData.confidentiality}
                                        onChange={e => setFormData({ ...formData, confidentiality: e.target.value })}
                                    >
                                        <option value="RESTRITO">Restrito (RH/Líder)</option>
                                        <option value="CONFIDENCIAL">Confidencial (Apenas RH)</option>
                                        <option value="COMPARTILHAVEL">Compartilhável</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área Envolvida</label>
                                    <select
                                        className="input-field w-full"
                                        value={formData.areaId}
                                        onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                                    >
                                        <option value="">Selecione a área...</option>
                                        {areas.map(area => (
                                            <option key={area.id} value={area.id}>{area.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Liderança Responsável</label>
                                    <select
                                        className="input-field w-full"
                                        value={formData.leaderId}
                                        onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
                                    >
                                        <option value="">Selecione o líder...</option>
                                        {collaborators.filter(c => c.role === 'LIDER' || c.role === 'MASTER').map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tema Principal</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Conflito de horários, Desentendimento..."
                                    className="input-field w-full"
                                    value={formData.theme}
                                    onChange={e => setFormData({ ...formData, theme: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Caso</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="input-field w-full resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalle o ocorrido..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Participantes</label>
                                <div className="flex gap-2 mb-2">
                                    <select
                                        className="input-field flex-1"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addParticipant(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    >
                                        <option value="">Adicionar participante...</option>
                                        {collaborators.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} - {c.collaboratorProfile?.area?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.participants.map((p, idx) => (
                                        <div key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                            <span>{p.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeParticipant(p.id)}
                                                className="hover:text-indigo-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas Internas (RH)</label>
                                <textarea
                                    rows={2}
                                    className="input-field w-full resize-none"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Observações restritas ao RH..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Salvar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediationCentral;
