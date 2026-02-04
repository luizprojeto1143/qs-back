import { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Link as LinkIcon, Building, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface InterpreterRequest {
    id: string;
    date: string;
    startTime: string;
    duration: number;
    theme: string;
    modality: string;
    status: string;
    description?: string;
    adminNotes?: string;
    meetingLink?: string;
    company: { name: string };
    requester: { name: string; email: string } | null;
    requesterName?: string;
}

const InterpreterCentral = () => {
    const [requests, setRequests] = useState<InterpreterRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Modal States
    const [selectedRequest, setSelectedRequest] = useState<InterpreterRequest | null>(null);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [responseStatus, setResponseStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [adminNotes, setAdminNotes] = useState('');
    const [meetingLink, setMeetingLink] = useState('');

    // Link Generation Modal
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    // Create Request Modal (Master)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        companyId: '',
        date: '',
        startTime: '',
        duration: 60,
        theme: '',
        modality: 'ONLINE',
        description: ''
    });

    // Delete Confirmation State
    const [requestToDelete, setRequestToDelete] = useState<InterpreterRequest | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchRequests = async () => {
        try {
            const params: any = {};
            if (filterStatus) params.status = filterStatus;

            const response = await api.get('/interpreter', { params });
            setRequests(response.data);
        } catch (error) {
            toast.error('Erro ao carregar solicitações');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (error) {
            // Silent fail or toast
        }
    }

    useEffect(() => {
        fetchRequests();
        fetchCompanies();
    }, [filterStatus]);

    const handleOpenResponseModal = (req: InterpreterRequest, status: 'APPROVED' | 'REJECTED') => {
        setSelectedRequest(req);
        setResponseStatus(status);
        setAdminNotes(req.adminNotes || '');
        setMeetingLink(req.meetingLink || '');
        setIsResponseModalOpen(true);
    };

    const handleSubmitResponse = async () => {
        if (!selectedRequest) return;

        try {
            await api.put(`/interpreter/${selectedRequest.id}/status`, {
                status: responseStatus,
                adminNotes,
                meetingLink: responseStatus === 'APPROVED' ? meetingLink : undefined
            });
            toast.success(`Solicitação ${responseStatus === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`);
            setIsResponseModalOpen(false);
            fetchRequests();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!createFormData.companyId) {
                toast.error('Selecione uma empresa');
                return;
            }

            await api.post('/interpreter', {
                ...createFormData,
                // requesterName will be inferred as user name (Master Name) or we could add a field
            });

            toast.success('Solicitação criada com sucesso!');
            setIsCreateModalOpen(false);
            setCreateFormData({
                companyId: '',
                date: '',
                startTime: '',
                duration: 60,
                theme: '',
                modality: 'ONLINE',
                description: ''
            });
            fetchRequests();
        } catch (error) {
            toast.error('Erro ao criar solicitação');
        }
    };

    const confirmDelete = (req: InterpreterRequest) => {
        setRequestToDelete(req);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!requestToDelete) return;
        try {
            await api.delete(`/interpreter/${requestToDelete.id}`);
            toast.success('Solicitação excluída com sucesso');
            fetchRequests();
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
        } catch (error) {
            toast.error('Erro ao excluir solicitação');
        }
    };

    const generatePublicLink = () => {
        if (!selectedCompanyId) {
            toast.error('Selecione uma empresa');
            return;
        }

        // Use window.location.origin to get base URL
        const link = `${window.location.origin}/solicitacao-interprete/${selectedCompanyId}`;
        navigator.clipboard.writeText(link);
        toast.success('Link copiado para a área de transferência!');
    };

    // Helper to format date correctly ignoring timezone shifts
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Adjust for timezone offset to ensure we display the correct day
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Intérpretes</h1>
                    <p className="text-gray-500">Gerencie as solicitações de todas as empresas</p>
                </div>
                <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <LinkIcon className="h-5 w-5" />
                    <span>Gerar Link Público</span>
                </button>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-3"
                >
                    <Plus className="h-5 w-5" />
                    <span>Novo Agendamento</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border-none focus:ring-0 text-sm font-medium text-gray-600"
                >
                    <option value="">Todos os Status</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="APPROVED">Aprovados</option>
                    <option value="REJECTED">Rejeitados</option>
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa / Solicitante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{req.company?.name || 'Empresa Desconhecida'}</div>
                                        <div className="text-sm text-gray-500">
                                            {req.requester?.name || req.requesterName || 'Externo'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatDate(req.date)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {req.startTime} ({req.duration} min)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate" title={req.theme}>
                                            <span className="font-medium">Tema:</span> {req.theme}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {req.modality}
                                        </div>
                                        {req.meetingLink && (
                                            <div className="text-xs text-blue-600 mt-1 truncate max-w-xs">{req.meetingLink}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                req.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {req.status === 'PENDING' || req.status === 'PENDENTE' ? 'Pendente' :
                                                req.status === 'APPROVED' ? 'Aprovado' :
                                                    req.status === 'REJECTED' ? 'Rejeitado' : req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status !== 'APPROVED' && req.status !== 'REJECTED' ? (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenResponseModal(req, 'APPROVED')}
                                                    className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded"
                                                    title="Aprovar"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenResponseModal(req, 'REJECTED')}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded"
                                                    title="Rejeitar"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(req)}
                                                    className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-1 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenResponseModal(req, req.status as 'APPROVED' | 'REJECTED')}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(req)}
                                                    className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-1 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Response Modal */}
            {isResponseModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">
                                {responseStatus === 'APPROVED' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {responseStatus === 'APPROVED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Link da Reunião (Opcional se presencial)
                                    </label>
                                    <input
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="https://meet.google.com/..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observações {responseStatus === 'REJECTED' && '(Obrigatório)'}
                                </label>
                                <textarea
                                    rows={4}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Adicione observações para o solicitante..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsResponseModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmitResponse}
                                className={`px-4 py-2 text-white rounded-lg ${responseStatus === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Generation Modal */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Gerar Link Público</h3>
                            <p className="text-sm text-gray-500">Selecione a empresa para gerar o link de solicitação</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <select
                                    value={selectedCompanyId}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Selecione uma empresa...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsLinkModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={generatePublicLink}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Copiar Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Request Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Novo Agendamento (Master)</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Fechar</span>
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <select
                                    required
                                    value={createFormData.companyId}
                                    onChange={(e) => setCreateFormData({ ...createFormData, companyId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Selecione a Empresa...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={createFormData.date}
                                        onChange={(e) => setCreateFormData({ ...createFormData, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                                    <input
                                        type="time"
                                        required
                                        value={createFormData.startTime}
                                        onChange={(e) => setCreateFormData({ ...createFormData, startTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                                    <input
                                        type="number"
                                        required
                                        min="15"
                                        step="15"
                                        value={createFormData.duration}
                                        onChange={(e) => setCreateFormData({ ...createFormData, duration: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                                    <select
                                        value={createFormData.modality}
                                        onChange={(e) => setCreateFormData({ ...createFormData, modality: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="ONLINE">Online</option>
                                        <option value="PRESENCIAL">Presencial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Assunto</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Treinamento, Reunião..."
                                    value={createFormData.theme}
                                    onChange={(e) => setCreateFormData({ ...createFormData, theme: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    rows={3}
                                    value={createFormData.description}
                                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="mr-3 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Agendar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && requestToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Agendamento?</h3>
                            <p className="text-gray-500 mb-6">
                                Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex space-x-3 justify-center">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterpreterCentral;
