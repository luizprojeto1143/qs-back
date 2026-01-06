import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { AlertTriangle, Filter } from 'lucide-react';
import type { Complaint } from '../../types/complaint';
import { ComplaintStats } from '../../components/master/complaints/ComplaintStats';
import { ComplaintList } from '../../components/master/complaints/ComplaintList';
import { ComplaintDetailModal } from '../../components/master/complaints/ComplaintDetailModal';

const ComplaintsCentral: React.FC = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [processingId, setProcessingId] = useState<string | null>(null);

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
        } catch {
            toast.error('Erro ao validar denúncia');
        } finally {
            setProcessingId(null);
        }
    };

    const handleTranslate = async (id: string, translation: string) => {
        if (!translation.trim()) {
            toast.error('Preencha a tradução');
            return;
        }
        setProcessingId(id);
        try {
            await api.patch(`/complaint/${id}/translate`, { translation });
            toast.success('Tradução salva!');
            loadComplaints();
        } catch {
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
        } catch {
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
        } catch {
            toast.error('Erro ao descartar');
        } finally {
            setProcessingId(null);
        }
    };

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

            <ComplaintStats complaints={complaints} />

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

            <ComplaintList complaints={complaints} onSelect={setSelectedComplaint} />

            <ComplaintDetailModal
                complaint={selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                onValidate={handleValidate}
                onDiscard={handleDiscard}
                onForwardToRH={handleForwardToRH}
                onTranslate={handleTranslate}
                processingId={processingId}
            />
        </div>
    );
};

export default ComplaintsCentral;
