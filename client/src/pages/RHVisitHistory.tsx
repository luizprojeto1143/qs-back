import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, User, Download, Filter, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonRow } from '../components/Skeleton';
import { api } from '../lib/api';
import { EmptyState } from '../components/EmptyState';

import { VisitDetailsModal } from '../components/modals/VisitDetailsModal';

interface Collaborator {
    user?: { name: string };
    name?: string;
    id: string;
}

interface Visit {
    id: string;
    date: string;
    company?: { name: string };
    area?: { name: string; id: string };
    master?: { name: string };
    collaborators?: Collaborator[];
    generatedPendencies: any[];
    isFinished?: boolean;
}

const RHVisitHistory = () => {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [areaFilter, setAreaFilter] = useState('');
    // const { companies } = useCompany(); // Keeping for now as it might be used later or just ignore lint
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

    // Stats calculation
    const currentMonthVisits = visits.filter(v => {
        const d = new Date(v.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const totalPendencies = visits.reduce((acc, v) => acc + (v.generatedPendencies?.length || 0), 0);

    const filteredVisits = visits.filter(visit => {
        const matchesSearch =
            visit.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.area?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.collaborators?.some((c) => c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = dateFilter ? new Date(visit.date).toISOString().split('T')[0] === dateFilter : true;
        const matchesArea = areaFilter ? visit.area?.id === areaFilter : true;

        return matchesSearch && matchesDate && matchesArea;
    });

    const uniqueAreas = Array.from(new Set(visits.map(v => JSON.stringify({ id: v.area?.id, name: v.area?.name }))))
        .map(s => JSON.parse(s))
        .filter(a => a.id);

    const handleExport = () => {
        if (filteredVisits.length === 0) {
            toast.error('Nenhum dado para exportar');
            return;
        }

        const headers = ['Data', 'Área', 'Equipe Presente', 'Responsável', 'Pendências Geradas', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredVisits.map(v => [
                new Date(v.date).toLocaleDateString(),
                `"${v.area?.name || 'N/A'}"`,
                `"${v.collaborators?.map((c) => c.user?.name || c.name).join(', ') || ''}"`,
                `"${v.master?.name || ''}"`,
                v.generatedPendencies?.length || 0,
                v.isFinished ? 'Concluído' : 'Em Andamento'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_visitas_rh_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Relatório exportado com sucesso!');
    };

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const response = await api.get('/visits');
                const rawData = response.data;
                const visitsList = Array.isArray(rawData) ? rawData : (rawData?.data || []);
                setVisits(Array.isArray(visitsList) ? visitsList : []);
            } catch (error) {
                console.error('Error fetching visits', error);
                toast.error('Erro ao carregar histórico');
            } finally {
                setLoading(false);
            }
        };

        fetchVisits();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Acompanhamentos</h1>
                    <p className="text-gray-500">Visão detalhada das visitas realizadas pelos consultores</p>
                </div>
                <button onClick={handleExport} className="btn-secondary flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Exportar Relatório</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Visitas este Mês</p>
                        <p className="text-xl font-bold text-gray-900">{currentMonthVisits}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Pendências Identificadas</p>
                        <p className="text-xl font-bold text-gray-900">{totalPendencies}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Acumulado</p>
                        <p className="text-xl font-bold text-gray-900">{visits.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por área, colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        className="flex-1 md:flex-none border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todas as Áreas</option>
                        {uniqueAreas.map(area => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="flex-1 md:flex-none border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : filteredVisits.length === 0 ? (
                <EmptyState
                    title="Nenhum registro encontrado"
                    description="Não encontramos visitas correspondentes aos filtros."
                    icon={Filter}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredVisits.map((visit) => (
                        <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-gray-100 rounded-lg">
                                        <FileText className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{visit.area?.name || 'Área Geral'}</h3>
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${visit.isFinished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {visit.isFinished ? 'Concluído' : 'Em Análise'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mt-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span>Data: {new Date(visit.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span>Resp: {visit.master?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span>
                                                    {visit.collaborators && visit.collaborators.length > 0
                                                        ? `Colaboradores: ${visit.collaborators.map(c => c.user?.name || c.name).join(', ')}`
                                                        : 'Nenhum colaborador específico vinculado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                    <div className="flex items-center gap-4 text-sm">
                                        {visit.generatedPendencies && visit.generatedPendencies.length > 0 && (
                                            <span className="flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                                <AlertTriangle className="h-4 w-4 mr-1" />
                                                {visit.generatedPendencies.length} pendência(s)
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                console.log('Opening details for visit:', visit.id);
                                                setSelectedVisitId(visit.id);
                                                setIsModalOpen(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                                        >
                                            Ver Detalhes →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <VisitDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                visitId={selectedVisitId}
            />
        </div>
    );
};

export default RHVisitHistory;
