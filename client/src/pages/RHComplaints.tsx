
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    Megaphone, CheckCircle, Clock, Filter,
    Video, FileText, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Complaint {
    id: string;
    type: 'VIDEO_LIBRAS' | 'TEXTO' | 'ANONIMO';
    category: string;
    severity: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    status: 'PENDENTE' | 'EM_ANALISE' | 'RESOLVIDO' | 'DESCARTADO';
    content?: string;
    videoUrl?: string;
    createdAt: string;
    confidentiality: string;
}

const RHComplaints = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            // Mock endpoint - assuming /complaints returns list
            // If backend is not ready, we catch error and use mocks for demo
            const res = await api.get('/complaints');
            setComplaints(res.data);
        } catch (error) {
            console.error("Error fetching complaints", error);
            // Fallback mock data for demo
            setComplaints([
                {
                    id: '1',
                    type: 'TEXTO',
                    category: 'Comportamento',
                    severity: 'MEDIO',
                    status: 'PENDENTE',
                    content: 'Relato de desentendimento recorrente entre colaboradores do turno da noite.',
                    createdAt: new Date().toISOString(),
                    confidentiality: 'RESTRITO'
                },
                {
                    id: '2',
                    type: 'VIDEO_LIBRAS',
                    category: 'Acessibilidade',
                    severity: 'ALTO',
                    status: 'EM_ANALISE',
                    videoUrl: 'https://example.com/video.mp4', // Mock
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    confidentiality: 'CONFIDENCIAL'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.put(`/complaints/${id}/status`, { status: newStatus });
            toast.success(`Status atualizado para ${newStatus}`);
            // Update local state
            setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
            if (selectedComplaint?.id === id) {
                setSelectedComplaint(prev => prev ? { ...prev, status: newStatus as any } : null);
            }
        } catch (error) {
            console.error("Error updating status", error);
            toast.error("Erro ao atualizar status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
            case 'EM_ANALISE': return 'bg-blue-100 text-blue-800';
            case 'RESOLVIDO': return 'bg-green-100 text-green-800';
            case 'DESCARTADO': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors = {
            'BAIXO': 'bg-gray-100 text-gray-800',
            'MEDIO': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'ALTO': 'bg-orange-50 text-orange-700 border-orange-200',
            'CRITICO': 'bg-red-50 text-red-700 border-red-200'
        };
        return (
            <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${(colors as any)[severity] || colors['BAIXO']}`}>
                {severity}
            </span>
        );
    };

    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [resolutionText, setResolutionText] = useState('');
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const handleResolveClick = (id: string) => {
        setResolvingId(id);
        setResolutionText('');
        setShowResolutionModal(true);
    };

    const confirmResolution = async () => {
        if (!resolvingId || !resolutionText.trim()) {
            toast.error("Por favor, descreva a resolução detalhadamente.");
            return;
        }

        try {
            await api.patch(`/complaint/${resolvingId}/resolve`, { resolution: resolutionText });
            toast.success("Denúncia resolvida com sucesso.");

            // Update local state
            setComplaints(prev => prev.map(c => c.id === resolvingId ? { ...c, status: 'RESOLVIDO', resolution: resolutionText } : c));
            if (selectedComplaint?.id === resolvingId) {
                setSelectedComplaint(prev => prev ? { ...prev, status: 'RESOLVIDO', resolution: resolutionText } : null);
            }

            setShowResolutionModal(false);
            setResolvingId(null);
        } catch (error) {
            console.error("Error resolving complaint", error);
            toast.error("Erro ao resolver denúncia.");
        }
    };

    const filteredComplaints = filterStatus === 'ALL'
        ? complaints
        : complaints.filter(c => c.status === filterStatus);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-primary" />
                        Ouvidoria e Denúncias
                    </h1>
                    <p className="text-gray-500">Gestão de relatos, canal de ética e suporte em Libras.</p>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="ALL">Todas</option>
                        <option value="PENDENTE">Pendentes</option>
                        <option value="EM_ANALISE">Em Análise</option>
                        <option value="RESOLVIDO">Resolvidas</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Column */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>)}
                        </div>
                    ) : filteredComplaints.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-500">
                            Nenhum relato encontrado.
                        </div>
                    ) : (
                        filteredComplaints.map(complaint => (
                            <div
                                key={complaint.id}
                                onClick={() => setSelectedComplaint(complaint)}
                                className={`
                                    p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                                    ${selectedComplaint?.id === complaint.id
                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                        : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {complaint.type === 'VIDEO_LIBRAS' ? (
                                            <Video className="h-4 w-4 text-purple-500" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-blue-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                            {complaint.type === 'VIDEO_LIBRAS' ? 'Vídeo em Libras' : 'Relato Escrito'}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(complaint.status)}`}>
                                        {complaint.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-800 mb-1">{complaint.category || 'Geral'}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {complaint.content || 'Conteúdo em vídeo ou anexo...'}
                                </p>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(complaint.createdAt), "dd/MM", { locale: ptBR })}
                                    </span>
                                    {getSeverityBadge(complaint.severity)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-2">
                    {selectedComplaint ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Protocolo #{selectedComplaint.id.slice(0, 8)}</span>
                                        {getSeverityBadge(selectedComplaint.severity)}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedComplaint.category || 'Relato de Ouvidoria'}</h2>
                                </div>
                                <div className="flex gap-2">
                                    {selectedComplaint.status !== 'RESOLVIDO' && selectedComplaint.status !== 'DESCARTADO' && (
                                        <button
                                            onClick={() => handleResolveClick(selectedComplaint.id)}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Resolver
                                        </button>
                                    )}
                                    {selectedComplaint.status === 'PENDENTE' && (
                                        <button
                                            onClick={() => handleStatusUpdate(selectedComplaint.id, 'EM_ANALISE')}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                        >
                                            Iniciar Análise
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Alerts about Confidentiality */}
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-800">Nível de Sigilo: {selectedComplaint.confidentiality}</h4>
                                        <p className="text-xs text-yellow-700 mt-1">Este relato contém informações sensíveis. Apenas pessoal autorizado deve ter acesso.</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Conteúdo do Relato</h3>
                                    {selectedComplaint.type === 'VIDEO_LIBRAS' && selectedComplaint.videoUrl ? (
                                        <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                            {/* Logic to play video would go here, defaulting to placeholder */}
                                            <div className="text-white text-center">
                                                <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Reprodutor de Vídeo (Libras)</p>
                                                <a href={selectedComplaint.videoUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs mt-2 block">
                                                    Abrir Link Externo
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-gray-800 leading-relaxed border border-gray-100">
                                            {selectedComplaint.content}
                                        </div>
                                    )}
                                </div>

                                {/* Resolution Details if Solved */}
                                {(selectedComplaint as any).resolution && (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <h3 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            Resolução Aplicada
                                        </h3>
                                        <p className="text-green-900 text-sm">{(selectedComplaint as any).resolution}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-gray-500 text-xs mb-1">Data de Abertura</span>
                                        <span className="font-medium text-gray-900">{format(new Date(selectedComplaint.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-gray-500 text-xs mb-1">Status Atual</span>
                                        <span className="font-medium text-gray-900">{selectedComplaint.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Megaphone className="h-12 w-12 mb-3 opacity-20" />
                            <p>Selecione um relato para visualizar detalhes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Resolução */}
            {showResolutionModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Resolver Denúncia</h2>
                            <p className="text-gray-500 text-sm mt-1">Descreva detalhadamente as ações tomadas para encerrar este caso.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tratativa e Conclusão <span className="text-red-500">*</span></label>
                                <textarea
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    placeholder="Ex: Foram realizadas reuniões com as partes, aplicado feedback e advertência conforme política interna. O colaborador ciente..."
                                    className="w-full p-4 border border-gray-300 rounded-xl h-40 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Esta informação será visível para a Consultoria QS e constará nos relatórios de auditoria.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowResolutionModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmResolution}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm shadow-green-900/20"
                            >
                                Confirmar Resolução
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RHComplaints;
