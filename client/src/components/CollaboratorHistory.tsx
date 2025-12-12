import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, MessageSquare, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { formatShift } from '../utils/formatters';

interface CollaboratorHistoryProps {
    collaboratorId: string;
    onClose: () => void;
}

const CollaboratorHistory = ({ collaboratorId, onClose }: CollaboratorHistoryProps) => {
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
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-start">
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
                <div className="px-6 pb-2">
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
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="h-6 w-6 text-gray-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'timeline' ? (
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {timelineItems.length === 0 && (
                            <p className="text-center text-gray-500 py-8">Nenhum histórico registrado.</p>
                        )}
                        {timelineItems.map((item, idx) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-white text-slate-500 group-[.is-active]:text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    {item.type === 'VISIT' ? <Calendar className="h-5 w-5 text-blue-500" /> : <MessageSquare className="h-5 w-5 text-amber-500" />}
                                </div>

                                {/* Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-slate-900">
                                            {item.type === 'VISIT' ? 'Visita de Acompanhamento' : 'Observação Individual'}
                                        </div>
                                        <time className="font-caveat font-medium text-indigo-500 text-xs">
                                            {item.date.toLocaleDateString()}
                                        </time>
                                    </div>

                                    {item.type === 'VISIT' ? (
                                        <div className="text-slate-500 text-sm">
                                            <p><span className="font-medium">Master:</span> {item.data.master?.name}</p>
                                            {item.data.observacoesMaster && (
                                                <p className="mt-2 italic">"{item.data.observacoesMaster}"</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-slate-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">
                                            <p className="italic">"{item.data.content}"</p>
                                            <p className="text-xs text-amber-600 mt-2 text-right">
                                                Registrado na visita de {new Date(item.data.visit?.date || item.data.createdAt).toLocaleDateString()}
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
        </div >
    );
};

export default CollaboratorHistory;
