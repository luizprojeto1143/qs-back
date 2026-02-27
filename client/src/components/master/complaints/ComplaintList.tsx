import { Video, EyeOff, MessageSquare, CheckCircle, ChevronRight, Calendar } from 'lucide-react';
import type { Complaint } from '../../../types/complaint';

interface ComplaintListProps {
    complaints: Complaint[];
    onSelect: (complaint: Complaint) => void;
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

export const ComplaintList = ({ complaints, onSelect }: ComplaintListProps) => {
    if (complaints.length === 0) {
        return (
            <div className="text-center py-16 card">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhuma denúncia</h3>
                <p className="text-gray-500 mt-1">Não há denúncias registradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {complaints.map((complaint) => (
                <div
                    key={complaint.id}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${complaint.severity === 'CRITICO' ? 'border-red-200 bg-red-50/50' :
                        complaint.severity === 'ALTO' ? 'border-orange-200 bg-orange-50/50' :
                            'border-gray-200 bg-white'
                        }`}
                    onClick={() => onSelect(complaint)}
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
            ))}
        </div>
    );
};
