import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, BarChart2, Users, Building, AlertCircle, PieChart, TrendingUp, ClipboardList, Loader, X } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

const reportTypes = [
    { id: 'VISIT_INDIVIDUAL', label: 'Relatório de Visita Individual', icon: ClipboardList, desc: 'Detalhes completos de uma visita específica.', param: 'visitId' },
    { id: 'COMPANY_MONTHLY', label: 'Relatório Mensal da Empresa', icon: Building, desc: 'Visão geral do mês para RH e diretoria.', param: null },
    { id: 'COLLABORATOR_HISTORY', label: 'Histórico do Colaborador', icon: Users, desc: 'Evolução individual e histórico de visitas.', param: 'collaboratorId' },
    { id: 'AREA_REPORT', label: 'Relatório de Área', icon: BarChart2, desc: 'Desempenho e pendências por área.', param: 'areaId' },
    { id: 'SECTOR_REPORT', label: 'Relatório de Setor', icon: PieChart, desc: 'Comparativo entre áreas do mesmo setor.', param: 'sectorId' },
    { id: 'PENDENCIES_REPORT', label: 'Relatório de Pendências', icon: AlertCircle, desc: 'Status de todas as pendências e prazos.', param: null },
    { id: 'COLLABORATOR_EVOLUTION', label: 'Evolução do Colaborador', icon: TrendingUp, desc: 'Gráficos de desempenho e adaptação.', param: 'collaboratorId' },
    { id: 'AREA_EVOLUTION', label: 'Evolução da Área', icon: TrendingUp, desc: 'Impacto do trabalho no ambiente.', param: 'areaId' },
    { id: 'LEADERSHIP_REPORT', label: 'Relatório da Liderança', icon: Users, desc: 'Avaliação e desempenho dos líderes.', param: null },
    { id: 'EXECUTIVE_SUMMARY', label: 'Relatório Executivo (Anual)', icon: FileText, desc: 'Painel estratégico para diretoria.', param: null },
    { id: 'INCLUSION_DIAGNOSIS', label: 'Diagnóstico de Inclusão', icon: ClipboardList, desc: 'Mapeamento de barreiras e acessibilidade.', param: null },
    { id: 'OPERATIONAL_REPORT', label: 'Relatório Operacional QS', icon: FileText, desc: 'Controle interno de produtividade.', param: null },
];

const Reports = () => {
    const navigate = useNavigate();
    // const { selectedCompanyId } = useCompany();
    const [generating, setGenerating] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [selectedValue, setSelectedValue] = useState('');

    // Data for dropdowns
    const [visits, setVisits] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (modalOpen && selectedReport?.param) {
            fetchDropdownData(selectedReport.param);
        }
    }, [modalOpen, selectedReport]);

    const fetchDropdownData = async (paramType: string) => {
        setLoadingData(true);
        try {
            if (paramType === 'visitId') {
                const res = await api.get('/visits');
                setVisits(res.data);
            } else if (paramType === 'collaboratorId') {
                const res = await api.get('/collaborators');
                setCollaborators(res.data);
            } else if (paramType === 'areaId') {
                const res = await api.get('/areas');
                setAreas(res.data);
            } else if (paramType === 'sectorId') {
                const res = await api.get('/sectors');
                setSectors(res.data);
            }
        } catch (error) {
            console.error('Error fetching dropdown data', error);
            toast.error('Erro ao carregar opções.');
        } finally {
            setLoadingData(false);
        }
    };

    const handleReportClick = (report: any) => {
        if (report.param) {
            setSelectedReport(report);
            setSelectedValue('');
            setModalOpen(true);
        } else {
            generateReport(report.id);
        }
    };

    const generateReport = async (type: string, paramValue?: string, extraFilters?: any) => {
        setGenerating(type);
        try {
            let filters: any = {
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                ...extraFilters
            };

            if (paramValue) {
                const paramName = reportTypes.find(r => r.id === type)?.param;
                if (paramName) filters[paramName] = paramValue;
            }

            const response = await api.post('/reports', { type, filters });

            if (response.data.success) {
                navigate('/dashboard/report-viewer', { state: { reportType: type, data: response.data.data } });
                setModalOpen(false);
            } else {
                toast.error('Erro ao gerar relatório: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error generating report', error);
            toast.error('Erro ao gerar relatório.');
        } finally {
            setGenerating(null);
        }
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedValue) {
            toast.error('Por favor, selecione uma opção.');
            return;
        }

        // Capture extra filters from form
        const formData = new FormData(e.target as HTMLFormElement);
        const month = formData.get('month');
        const year = formData.get('year');

        const extraFilters: any = {};
        if (month) extraFilters.month = parseInt(month.toString());
        if (year) extraFilters.year = parseInt(year.toString());

        generateReport(selectedReport.id, selectedValue, extraFilters);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Central de Relatórios</h1>
                <p className="text-gray-500">Selecione o tipo de relatório que deseja gerar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => handleReportClick(report)}
                        disabled={generating !== null}
                        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group disabled:opacity-50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <report.icon className="h-6 w-6 text-primary" />
                            </div>
                            {generating === report.id && <Loader className="h-5 w-5 text-primary animate-spin" />}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{report.label}</h3>
                        <p className="text-sm text-gray-500">{report.desc}</p>
                    </button>
                ))}
            </div>

            {/* Selection Modal */}
            {modalOpen && selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{selectedReport.label}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleModalSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selecione {selectedReport.param === 'visitId' ? 'a Visita' :
                                        selectedReport.param === 'collaboratorId' ? 'o Colaborador' :
                                            selectedReport.param === 'areaId' ? 'a Área' : 'o Setor'}
                                </label>

                                {loadingData ? (
                                    <div className="text-center py-4 text-gray-500">Carregando opções...</div>
                                ) : (
                                    <select
                                        className="input-field"
                                        value={selectedValue}
                                        onChange={(e) => setSelectedValue(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {selectedReport.param === 'visitId' && visits.map(v => (
                                            <option key={v.id} value={v.id}>{new Date(v.date).toLocaleDateString()} - {v.area?.name}</option>
                                        ))}
                                        {selectedReport.param === 'collaboratorId' && collaborators.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                        {selectedReport.param === 'areaId' && areas.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                        {selectedReport.param === 'sectorId' && sectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Month/Year Filter for Evolution Reports */}
                            {(selectedReport.id === 'AREA_EVOLUTION' || selectedReport.id === 'COLLABORATOR_EVOLUTION') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                                        <select className="input-field" name="month">
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                                        <select className="input-field" name="year">
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loadingData || generating !== null}
                                className="btn-primary w-full"
                            >
                                {generating ? 'Gerando...' : 'Gerar Relatório'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
