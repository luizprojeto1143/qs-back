import { useRef, useEffect } from 'react';
import { X, Calendar, MapPin, User, FileText, CheckSquare, Paperclip, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VisitDetailsModalProps {
    visitId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const VisitDetailsModal = ({ visitId, isOpen, onClose }: VisitDetailsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const { data: visit, isLoading } = useQuery({
        queryKey: ['visit', visitId],
        queryFn: async () => {
            if (!visitId) return null;
            const res = await api.get(`/visits/${visitId}`);
            return res.data;
        },
        enabled: !!visitId && isOpen
    });

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div
                ref={modalRef}
                className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        Detalhes do Acompanhamento
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {isLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-20 bg-gray-100 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-20 bg-gray-100 rounded"></div>
                        </div>
                    ) : visit ? (
                        <>
                            {/* Meta Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium text-gray-900">
                                        {format(new Date(visit.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="h-4 w-4 text-orange-500" />
                                    <span>{visit.area?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <User className="h-4 w-4 text-green-500" />
                                    <span>Resp: {visit.master?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <User className="h-4 w-4 text-purple-500" />
                                    <span>Colabs: {visit.collaborators?.map((c: { user: { name: string } }) => c.user.name).join(', ')}</span>
                                </div>
                            </div>

                            {/* Relatos */}
                            <div className="space-y-6">
                                {visit.relatoLideranca && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <h3 className="flex items-center space-x-2 font-semibold text-blue-900 mb-2">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Relato da Liderança</span>
                                        </h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{visit.relatoLideranca}</p>
                                    </div>
                                )}

                                {visit.relatoColaborador && (
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <h3 className="flex items-center space-x-2 font-semibold text-green-900 mb-2">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Relato do Colaborador</span>
                                        </h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{visit.relatoColaborador}</p>
                                    </div>
                                )}

                                {visit.relatoConsultoria && (
                                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                        <h3 className="flex items-center space-x-2 font-semibold text-purple-900 mb-2">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Relato da Consultoria</span>
                                        </h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{visit.relatoConsultoria}</p>
                                    </div>
                                )}

                                {visit.observacoesMaster && (
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="flex items-center space-x-2 font-semibold text-gray-900 mb-2">
                                            <FileText className="h-4 w-4" />
                                            <span>Observações da Consultoria</span>
                                        </h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{visit.observacoesMaster}</p>
                                    </div>
                                )}
                            </div>

                            {/* Pendências Geradas */}
                            {visit.generatedPendencies && visit.generatedPendencies.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                        <CheckSquare className="h-5 w-5 text-orange-500" />
                                        <span>Pendências Geradas</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {visit.generatedPendencies.map((p: { id: string; status: string; description: string }) => (
                                            <div key={p.id} className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${p.status === 'RESOLVIDA' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                    <span className="text-gray-700 font-medium">{p.description}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 uppercase">{p.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notas Individuais */}
                            {visit.notes && visit.notes.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                        <FileText className="h-5 w-5 text-purple-500" />
                                        <span>Anotações Individuais</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {visit.notes.map((note: { id: string; collaborator?: { user: { name: string } }; content: string }) => (
                                            <div key={note.id} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                <p className="text-xs font-bold text-purple-800 mb-1">{note.collaborator?.user?.name}</p>
                                                <p className="text-gray-700">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Anexos */}
                            {visit.attachments && visit.attachments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                        <Paperclip className="h-5 w-5 text-gray-500" />
                                        <span>Anexos</span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {visit.attachments.map((file: { id: string; url: string; name: string }) => (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <Paperclip className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-blue-600 truncate">{file.name || 'Arquivo anexado'}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Informações não encontradas.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
