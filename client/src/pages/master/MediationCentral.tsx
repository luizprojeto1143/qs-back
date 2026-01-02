import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DecisionTimeline from '../../components/qs/DecisionTimeline';
import {
    Scale,
    Filter,
    Plus,
    X,
    Search,
    Calendar,
    User,
    FileText,
    CheckCircle,
    AlertTriangle,
    Clock,
    Gavel,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useCompany } from '../../contexts/CompanyContext';

const MediationCentral = () => {
    const { selectedCompanyId } = useCompany();
    const [searchParams] = useSearchParams();

    const [mediations, setMediations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
        participants: [] as string[],
        confidentiality: 'RESTRITO',
        notes: ''
    });

    // Temp participant input
    const [participantInput, setParticipantInput] = useState('');

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

    useEffect(() => {
        loadMediations();
    }, [selectedCompanyId, filters.status, filters.startDate, filters.endDate]);

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
            confidentiality: 'RESTRITO',
            notes: ''
        });
        setParticipantInput('');
    };

    const addParticipant = () => {
        if (participantInput.trim()) {
            setFormData(prev => ({
                ...prev,
                participants: [...prev.participants, participantInput.trim()]
            }));
            setParticipantInput('');
        }
    };

    const removeParticipant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter((_, i) => i !== index)
        }));
    };

    const filteredList = mediations.filter(m =>
        m.theme.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.description?.toLowerCase().includes(filters.search.toLowerCase())
    );

    return (
        <div className="space-y-6">
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
                    <h3 className="tex-lg font-medium text-gray-900">Nenhuma mediação encontrada</h3>
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
                                            <User className="w-4 h-4" />
                                            {item.participants.length} Participantes
                                        </span>
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
                                                className="btn-xs bg-green-50 text-green-700 hover:bg-green-100 border-none"
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Registrar Acordo
                                            </button>
                                            <button
                                                onClick={() => handleConclude(item.id, 'SEM_ACORDO')}
                                                className="btn-xs bg-red-50 text-red-700 hover:bg-red-100 border-none"
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Sem Acordo
                                            </button>
                                            <button
                                                onClick={() => handleConclude(item.id, 'ENCAMINHAMENTO')}
                                                className="btn-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-none"
                                            >
                                                <FileText className="w-3 h-3 mr-1" />
                                                Encaminhar RH
                                            </button>
                                        </div>
                                    )}

                                    {/* Timeline Toggle */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mt-4 font-medium transition-colors"
                                    >
                                        {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        {expandedId === item.id ? 'Ocultar Histórico' : 'Ver Histórico Jurídico'}
                                    </button>

                                    {expandedId === item.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                Linha do Tempo Jurídica
                                            </h4>
                                            <DecisionTimeline entityType="MEDIATION" entityId={item.id} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Mediação' : 'Nova Mediação'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Data</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Confidencialidade</label>
                                    <select
                                        className="input-field"
                                        value={formData.confidentiality}
                                        onChange={e => setFormData({ ...formData, confidentiality: e.target.value })}
                                    >
                                        <option value="RESTRITO">Restrito (RH/Master)</option>
                                        <option value="CONFIDENCIAL">Confidencial (Apenas Master)</option>
                                        <option value="COMPARTILHAVEL">Compartilhável (Liderança)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Tema do Conflito</label>
                                <input
                                    type="text" required className="input-field"
                                    placeholder="Ex: Desentendimento sobre regime de escala"
                                    value={formData.theme}
                                    onChange={e => setFormData({ ...formData, theme: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Descrição Detalhada</label>
                                <textarea
                                    className="input-field" rows={4}
                                    placeholder="Descreva o contexto e os pontos principais..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Participantes</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Nome do colaborador ou envolvido"
                                        value={participantInput}
                                        onChange={e => setParticipantInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                                    />
                                    <button type="button" onClick={addParticipant} className="btn-secondary">Adicionar</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.participants.map((p, i) => (
                                        <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {p}
                                            <button type="button" onClick={() => removeParticipant(i)} className="text-gray-400 hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">Notas Internas</label>
                                <textarea
                                    className="input-field" rows={2}
                                    placeholder="Anotações privadas para a equipe de mediação..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediationCentral;
