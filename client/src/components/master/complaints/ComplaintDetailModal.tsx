import { useState } from 'react';
import { XCircle, CheckCircle, Send } from 'lucide-react';
import type { Complaint } from '../../../types/complaint';

interface ComplaintDetailModalProps {
    complaint: Complaint | null;
    onClose: () => void;
    onValidate: (id: string) => Promise<void>;
    onDiscard: (id: string) => Promise<void>;
    onForwardToRH: (id: string) => Promise<void>;
    onTranslate: (id: string, translation: string) => Promise<void>;
    processingId: string | null;
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


export const ComplaintDetailModal = ({
    complaint,
    onClose,
    onValidate,
    onDiscard,
    onForwardToRH,
    onTranslate,
    processingId
}: ComplaintDetailModalProps) => {
    const [translation, setTranslation] = useState('');

    if (!complaint) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Detalhes da Denúncia</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Tipo</p>
                            <p className="font-medium">{complaint.type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            {getStatusBadge(complaint.status)}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Severidade</p>
                            {getSeverityBadge(complaint.severity)}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Área</p>
                            <p className="font-medium">{complaint.area?.name || '-'}</p>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    {complaint.content && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Conteúdo</p>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-700 whitespace-pre-wrap">{complaint.content}</p>
                            </div>
                        </div>
                    )}

                    {/* Vídeo LIBRAS */}
                    {complaint.type === 'VIDEO_LIBRAS' && complaint.videoUrl && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Vídeo em LIBRAS</p>
                            <video
                                src={complaint.videoUrl}
                                controls
                                className="w-full rounded-xl"
                            />
                        </div>
                    )}

                    {/* Tradução */}
                    {complaint.type === 'VIDEO_LIBRAS' && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Tradução</p>
                            {complaint.translation ? (
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-gray-700 whitespace-pre-wrap">{complaint.translation}</p>
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
                                        onClick={() => onTranslate(complaint.id, translation)}
                                        disabled={processingId === complaint.id}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Salvar Tradução
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detalhes da Resolução (RH) */}
                    {complaint.status === 'RESOLVIDO' && complaint.resolution && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h3 className="font-bold text-green-800">Resolução do RH</h3>
                            </div>
                            <p className="text-green-900 text-sm whitespace-pre-wrap">
                                {complaint.resolution}
                            </p>
                            <div className="mt-2 text-xs text-green-600 font-medium">
                                Resolvido em {new Date(complaint.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        {complaint.status === 'PENDENTE' && (
                            <>
                                <button
                                    onClick={() => onValidate(complaint.id)}
                                    disabled={processingId === complaint.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Validar
                                </button>
                                <button
                                    onClick={() => onDiscard(complaint.id)}
                                    disabled={processingId === complaint.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Descartar
                                </button>
                            </>
                        )}
                        {complaint.status === 'VALIDADO' && (
                            <button
                                onClick={() => onForwardToRH(complaint.id)}
                                disabled={processingId === complaint.id}
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
    );
};
