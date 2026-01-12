import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, MessageSquare, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { formatShift } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

interface CollaboratorHistoryProps {
    collaboratorId: string;
    onClose: () => void;
}

const CollaboratorHistory = ({ collaboratorId, onClose }: CollaboratorHistoryProps) => {
    const navigate = useNavigate();
    const [collaborator, setCollaborator] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'timeline' | 'pendencies'>('timeline');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/collaborators/${collaboratorId}`);
                setCollaborator(response.data);
            } catch (error) {
                console.error('Error fetching history', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [collaboratorId]);

    const handleNavigateToVisit = (visitId: string) => {
        const userStr = localStorage.getItem('user');
        const userRole = userStr ? JSON.parse(userStr).role : '';
        const basePath = userRole === 'RH' ? '/rh' : '/dashboard';

        navigate(`${basePath}/visits/new`, { state: { visitId, mode: 'edit' } });
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl">Carregando histórico...</div>
        </div>
    );

    if (!collaborator) return null;

    // Merge Visits and Notes into a single timeline
    const timelineItems = [
        ...(collaborator.collaboratorProfile?.visits || []).map((v: any) => ({
            type: 'VISIT',
            date: new Date(v.date),
            data: v
        })),
        ...(collaborator.collaboratorProfile?.visitNotes || []).map((n: any) => ({
            type: 'NOTE',
            date: new Date(n.createdAt),
            data: n
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto animate-slide-in flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-start shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden text-gray-400 shrink-0">
                            {collaborator.avatar ? (
                                <img src={collaborator.avatar} alt={collaborator.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold">{collaborator.name.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{collaborator.name}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {collaborator.collaboratorProfile?.area?.name} • {formatShift(collaborator.collaboratorProfile?.shift)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>
                <div className="px-6 pb-2 shrink-0">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Linha do Tempo
                        </button>
                        <button
                            onClick={() => setActiveTab('pendencies')}
                            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pendencies' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Pendências ({collaborator.collaboratorProfile?.pendingItems?.length || 0})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 bg-gray-50/30">
                    {activeTab === 'timeline' ? (
                        <div className="space-y-8 pl-8 relative border-l-2 border-slate-200 ml-6 my-2">
                            {timelineItems.length === 0 && (
                                <p className="text-gray-500 py-4 italic text-sm -ml-8 text-center bg-white p-4 rounded-xl border border-dashed border-gray-200">
                                    Nenhum histórico registrado.
                                </p>
                            )}
                            {timelineItems.map((item, idx) => (
                                <div key={idx} className="relative">
                                    {/* Icon */}
                                    <div className="absolute -left-[49px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 shadow-sm z-10 transition-transform hover:scale-110">
                                        {item.type === 'VISIT' ? <Calendar className="h-4 w-4 text-blue-500" /> : <MessageSquare className="h-4 w-4 text-amber-500" />}
                                    </div>

                                    {/* Card */}
                                    <div
                                        className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group ${item.type === 'VISIT' ? 'cursor-pointer hover:border-blue-300 ring-blue-100 hover:ring-2' : ''}`}
                                        onClick={() => item.type === 'VISIT' && handleNavigateToVisit(item.data.id)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] tracking-wider font-bold px-2 py-1 rounded-full uppercase ${item.type === 'VISIT' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                {item.type === 'VISIT' ? 'Visita' : 'Observação'}
                                            </span>
                                            <time className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {item.date.toLocaleDateString()}
                                            </time>
                                        </div>

                                        {item.type === 'VISIT' ? (
                                            <div className="text-sm text-gray-600 space-y-3">
                                                <div className="flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-2">
                                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                                    <span className="font-semibold">Consultoria QS:</span> {item.data.master?.name}
                                                </div>
                                                {item.data.observacoesMaster ? (
                                                    <div className="bg-slate-50 p-3 rounded-lg text-slate-700 italic border border-slate-100 relative">
                                                        "{item.data.observacoesMaster}"
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">Sem observações registradas</span>
                                                )}

                                                <div className="pt-1 flex justify-end">
                                                    <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Clique para ver detalhes &rarr;
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-600">
                                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-900/80">
                                                    <p className="italic">"{item.data.content}"</p>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2 text-right flex justify-end items-center gap-1">
                                                    Registrado em {new Date(item.data.visit?.date || item.data.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {collaborator.collaboratorProfile?.pendingItems?.length === 0 && (
                                <p className="text-center text-gray-500 py-8">Nenhuma pendência registrada.</p>
                            )}
                            {collaborator.collaboratorProfile?.pendingItems?.map((pendency: any) => (
                                <div key={pendency.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start space-x-4">
                                    <div className={`p-2 rounded-lg ${pendency.status === 'RESOLVIDA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {pendency.status === 'RESOLVIDA' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{pendency.description}</h4>
                                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                            <span>Prioridade: {pendency.priority}</span>
                                            {pendency.deadline && (
                                                <span className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {new Date(pendency.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollaboratorHistory;
