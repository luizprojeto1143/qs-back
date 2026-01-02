import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    MessageSquare, Video, EyeOff, AlertTriangle,
    CheckCircle, Send, XCircle, Clock, Filter,
    FileText, User, Calendar, ChevronRight
} from 'lucide-react';

interface Complaint {
    id: string;
    type: string;
    content?: string;
    videoUrl?: string;
    translation?: string;
    category?: string;
    severity: string;
    status: string;
    confidentiality: string;
    area?: { name: string };
    reporter?: { name: string };
    validatedBy?: { name: string };
    createdAt: string;
    resolution?: string;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PENDENTE': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pendente</span>;
        case 'EM_ANALISE': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Em Análise</span>;
        case 'VALIDADO': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Validado</span>;
        case 'ENCAMINHADO_RH': return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Enviado RH</span>;
        case 'RESOLVIDO': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Resolvido</span>;
        case 'DESCARTADO': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Descartado</span>;
        default: return null;
    }
};

const getSeverityBadge = (severity: string) => {
    switch (severity) {
        case 'CRITICO': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Crítico</span>;
        case 'ALTO': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Alto</span>;
        case 'MEDIO': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Médio</span>;
        case 'BAIXO': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Baixo</span>;
        default: return null;
    }
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'VIDEO_LIBRAS': return <Video className="w-5 h-5 text-blue-600" />;
        case 'ANONIMO': return <EyeOff className="w-5 h-5 text-gray-600" />;
        default: return <MessageSquare className="w-5 h-5 text-green-600" />;
    }
};

const ComplaintsCentral: React.FC = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [translation, setTranslation] = useState('');

    useEffect(() => {
        if (selectedCompanyId) {
            loadComplaints();
        }
    }, [selectedCompanyId, filterStatus]);

    const loadComplaints = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const query = filterStatus ? `?status=${filterStatus}` : '';
            const res = await api.get(`/complaints/${selectedCompanyId}${query}`);
            setComplaints(res.data);
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error('Módulo de denúncias não está habilitado');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (id: string) => {
        setProcessingId(id);
        try {
            await api.patch(`/complaint/${id}/validate`, {});
            toast.success('Denúncia validada!');
            loadComplaints();
            setSelectedComplaint(null);
        } catch (error) {
            toast.error('Erro ao validar denúncia');
        } finally {
            setProcessingId(null);
        }
    };

    const handleTranslate = async (id: string) => {
        if (!translation.trim()) {
            toast.error('Preencha a tradução');
            return;
        }
        setProcessingId(id);
        try {
            await api.patch(`/complaint/${id}/translate`, { translation });
            toast.success('Tradução salva!');
            loadComplaints();
            setTranslation('');
        } catch (error) {
            toast.error('Erro ao salvar tradução');
        } finally {
            setProcessingId(null);
        }
    };

    const handleForwardToRH = async (id: string) => {
        setProcessingId(id);
        try {
            await api.patch(`/complaint/${id}/forward`, { rhNotes: 'Denúncia validada pela QS' });
            toast.success('Denúncia enviada ao RH!');
            loadComplaints();
            setSelectedComplaint(null);
        } catch (error) {
            toast.error('Erro ao enviar ao RH');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDiscard = async (id: string) => {
        setProcessingId(id);
        try {
            await api.patch(`/complaint/${id}/discard`, { reason: 'Descartada pela QS' });
            toast.success('Denúncia descartada');
            loadComplaints();
            setSelectedComplaint(null);
        } catch (error) {
            toast.error('Erro ao descartar');
        } finally {
            setProcessingId(null);
        }
    };

    const pendingCount = complaints.filter(c => c.status === 'PENDENTE').length;
    const analysisCount = complaints.filter(c => c.status === 'EM_ANALISE').length;
    const validatedCount = complaints.filter(c => c.status === 'VALIDADO').length;

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl text-white">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        Central de Denúncias
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie denúncias e encaminhe ao RH</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                        <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                        <p className="text-sm text-gray-500">Pendentes</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-600">{analysisCount}</p>
                        <p className="text-sm text-gray-500">Em Análise</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-600">{validatedCount}</p>
                        <p className="text-sm text-gray-500">Validadas</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Todos os status</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="VALIDADO">Validado</option>
                    <option value="ENCAMINHADO_RH">Enviado RH</option>
                    <option value="RESOLVIDO">Resolvido</option>
                </select>
            </div>

            {/* List */}
            <div className="space-y-4">
                {complaints.length === 0 ? (
                    <div className="text-center py-16 card">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma denúncia</h3>
                        <p className="text-gray-500 mt-1">Não há denúncias registradas</p>
                    </div>
                ) : (
                    complaints.map((complaint) => (
                        <div
                            key={complaint.id}
                            className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${complaint.severity === 'CRITICO' ? 'border-red-200 bg-red-50/50' :
                                complaint.severity === 'ALTO' ? 'border-orange-200 bg-orange-50/50' :
                                    'border-gray-200 bg-white'
                                }`}
                            onClick={() => setSelectedComplaint(complaint)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    {getTypeIcon(complaint.type)}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusBadge(complaint.status)}
                                            {getSeverityBadge(complaint.severity)}
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {complaint.type === 'VIDEO_LIBRAS' ? 'Denúncia em Vídeo (LIBRAS)' :
                                                complaint.type === 'ANONIMO' ? 'Denúncia Anônima' : 'Denúncia por Texto'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {complaint.translation || complaint.content || 'Aguardando tradução...'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            {complaint.area && <span>Área: {complaint.area.name}</span>}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(complaint.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Detalhes */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Detalhes da Denúncia</h2>
                                <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <XCircle className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Tipo</p>
                                    <p className="font-medium">{selectedComplaint.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    {getStatusBadge(selectedComplaint.status)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Severidade</p>
                                    {getSeverityBadge(selectedComplaint.severity)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Área</p>
                                    <p className="font-medium">{selectedComplaint.area?.name || '-'}</p>
                                </div>
                            </div>

                            {/* Conteúdo */}
                            {selectedComplaint.content && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Conteúdo</p>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.content}</p>
                                    </div>
                                </div>
                            )}

                            {/* Vídeo LIBRAS */}
                            {selectedComplaint.type === 'VIDEO_LIBRAS' && selectedComplaint.videoUrl && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Vídeo em LIBRAS</p>
                                    <video
                                        src={selectedComplaint.videoUrl}
                                        controls
                                        className="w-full rounded-xl"
                                    />
                                </div>
                            )}

                            {/* Tradução */}
                            {selectedComplaint.type === 'VIDEO_LIBRAS' && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Tradução</p>
                                    {selectedComplaint.translation ? (
                                        <div className="p-4 bg-blue-50 rounded-xl">
                                            <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.translation}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <textarea
                                                value={translation}
                                                onChange={(e) => setTranslation(e.target.value)}
                                                placeholder="Digite a tradução do vídeo..."
                                                className="w-full p-4 border border-gray-300 rounded-xl resize-none h-32"
                                            />
                                            <button
                                                onClick={() => handleTranslate(selectedComplaint.id)}
                                                disabled={processingId === selectedComplaint.id}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                Salvar Tradução
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Detalhes da Resolução (RH) */}
                            {selectedComplaint.status === 'RESOLVIDO' && selectedComplaint.resolution && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <h3 className="font-bold text-green-800">Resolução do RH</h3>
                                    </div>
                                    <p className="text-green-900 text-sm whitespace-pre-wrap">
                                        {selectedComplaint.resolution}
                                    </p>
                                    <div className="mt-2 text-xs text-green-600 font-medium">
                                        Resolvido em {new Date(selectedComplaint.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            )}

                            {/* Ações */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                {selectedComplaint.status === 'PENDENTE' && (
                                    <>
                                        <button
                                            onClick={() => handleValidate(selectedComplaint.id)}
                                            disabled={processingId === selectedComplaint.id}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Validar
                                        </button>
                                        <button
                                            onClick={() => handleDiscard(selectedComplaint.id)}
                                            disabled={processingId === selectedComplaint.id}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Descartar
                                        </button>
                                    </>
                                )}
                                {selectedComplaint.status === 'VALIDADO' && (
                                    <button
                                        onClick={() => handleForwardToRH(selectedComplaint.id)}
                                        disabled={processingId === selectedComplaint.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                        Enviar ao RH
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsCentral;
