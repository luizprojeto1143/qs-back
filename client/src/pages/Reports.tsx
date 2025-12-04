import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, BarChart2, Users, Building, AlertCircle, PieChart, TrendingUp, ClipboardList, Loader } from 'lucide-react';

const reportTypes = [
    { id: 'VISIT_INDIVIDUAL', label: 'Relatório de Visita Individual', icon: ClipboardList, desc: 'Detalhes completos de uma visita específica.' },
    { id: 'COMPANY_MONTHLY', label: 'Relatório Mensal da Empresa', icon: Building, desc: 'Visão geral do mês para RH e diretoria.' },
    { id: 'COLLABORATOR_HISTORY', label: 'Histórico do Colaborador', icon: Users, desc: 'Evolução individual e histórico de visitas.' },
    { id: 'AREA_REPORT', label: 'Relatório de Área', icon: BarChart2, desc: 'Desempenho e pendências por área.' },
    { id: 'SECTOR_REPORT', label: 'Relatório de Setor', icon: PieChart, desc: 'Comparativo entre áreas do mesmo setor.' },
    { id: 'PENDENCIES_REPORT', label: 'Relatório de Pendências', icon: AlertCircle, desc: 'Status de todas as pendências e prazos.' },
    { id: 'COLLABORATOR_EVOLUTION', label: 'Evolução do Colaborador', icon: TrendingUp, desc: 'Gráficos de desempenho e adaptação.' },
    { id: 'AREA_EVOLUTION', label: 'Evolução da Área', icon: TrendingUp, desc: 'Impacto do trabalho no ambiente.' },
    { id: 'LEADERSHIP_REPORT', label: 'Relatório da Liderança', icon: Users, desc: 'Avaliação e desempenho dos líderes.' },
    { id: 'EXECUTIVE_SUMMARY', label: 'Relatório Executivo (Anual)', icon: FileText, desc: 'Painel estratégico para diretoria.' },
    { id: 'INCLUSION_DIAGNOSIS', label: 'Diagnóstico de Inclusão', icon: ClipboardList, desc: 'Mapeamento de barreiras e acessibilidade.' },
    { id: 'OPERATIONAL_REPORT', label: 'Relatório Operacional QS', icon: FileText, desc: 'Controle interno de produtividade.' },
];

const Reports = () => {
    const navigate = useNavigate();
    const [generating, setGenerating] = useState<string | null>(null);

    const handleGenerate = async (type: string) => {
        setGenerating(type);
        try {
            const token = localStorage.getItem('token');
            // For demo purposes, we are sending empty filters. 
            // In a real scenario, we would open a modal to ask for Date/ID first.
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type, filters: { month: new Date().getMonth(), year: new Date().getFullYear() } })
            });

            const result = await response.json();

            if (result.success) {
                navigate('/dashboard/report-viewer', { state: { reportType: type, data: result.data } });
            } else {
                alert('Erro ao gerar relatório: ' + result.error);
            }
        } catch (error) {
            console.error('Error generating report', error);
            alert('Erro ao gerar relatório.');
        } finally {
            setGenerating(null);
        }
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
                        onClick={() => handleGenerate(report.id)}
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
        </div>
    );
};

export default Reports;
