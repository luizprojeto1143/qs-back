import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, User, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonRow } from '../components/Skeleton';
import { api } from '../lib/api';

const VisitHistory = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredVisits = visits.filter(visit => {
        const matchesSearch =
            visit.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.area?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.collaborators?.some((c: any) => c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = dateFilter ? new Date(visit.date).toISOString().split('T')[0] === dateFilter : true;

        return matchesSearch && matchesDate;
    });

    const handleExport = () => {
        if (filteredVisits.length === 0) {
            toast.error('Nenhum dado para exportar');
            return;
        }

        const headers = ['Data', 'Empresa', 'Área', 'Colaboradores', 'Responsável'];
        const csvContent = [
            headers.join(','),
            ...filteredVisits.map(v => [
                new Date(v.date).toLocaleDateString(),
                `"${v.company?.name || ''}"`,
                `"${v.area?.name || ''}"`,
                `"${v.collaborators?.map((c: any) => c.user?.name).join(', ') || ''}"`,
                `"${v.master?.name || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `historico_visitas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Relatório exportado com sucesso!');
    };

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const response = await api.get('/visits');
                setVisits(response.data);
            } catch (error) {
                console.error('Error fetching visits', error);
                toast.error('Erro ao carregar histórico de visitas');
            } finally {
                setLoading(false);
            }
        };

        fetchVisits();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Visitas</h1>
                    <p className="text-gray-500">Registro completo de acompanhamentos</p>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleExport} className="btn-secondary flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : filteredVisits.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Nenhuma visita encontrada com os filtros atuais.</div>
            ) : (
                <div className="space-y-4">
                    {filteredVisits.map((visit) => (
                        <div key={visit.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{visit.company?.name || 'Empresa não identificada'}</h3>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                {visit.area?.name || 'Área não identificada'}
                                            </span>
                                            <span className="flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                {visit.collaborators?.map((c: any) => c.user?.name).join(', ') || 'Sem colaboradores'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Concluído
                                    </span>
                                    <p className="text-xs text-gray-400 mt-2">Registrado por {visit.master?.name}</p>
                                    <p className="text-xs text-gray-400">{new Date(visit.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VisitHistory;
