import { Clock, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import type { Complaint } from '../../../types/complaint';

interface ComplaintStatsProps {
    complaints: Complaint[];
}

export const ComplaintStats = ({ complaints }: ComplaintStatsProps) => {
    const pendingCount = complaints.filter(c => c.status === 'PENDENTE').length;
    const analysisCount = complaints.filter(c => c.status === 'EM_ANALISE').length;
    const validatedCount = complaints.filter(c => c.status === 'VALIDADO').length;

    return (
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
    );
};
