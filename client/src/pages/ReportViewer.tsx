import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportViewer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { reportType, data } = location.state || {};
    const [reportData] = useState<any>(data);

    useEffect(() => {
        if (!reportData) {
            // If accessed directly without state, redirect back
            navigate('/dashboard/reports');
        }
    }, [reportData, navigate]);

    if (!reportData) return <div>Carregando...</div>;

    const handlePrint = () => {
        window.print();
    };

    const renderContent = () => {
        switch (reportType) {
            case 'COMPANY_MONTHLY':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                                <h3 className="text-sm text-gray-500 uppercase">Total de Visitas</h3>
                                <p className="text-3xl font-bold text-primary">{reportData.stats.totalVisits}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                                <h3 className="text-sm text-gray-500 uppercase">Pendências Abertas</h3>
                                <p className="text-3xl font-bold text-red-500">{reportData.stats.totalPendencies}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                                <h3 className="text-sm text-gray-500 uppercase">Colaboradores Ativos</h3>
                                <p className="text-3xl font-bold text-green-600">{reportData.stats.activeCollaborators}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="h-80 border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-bold mb-4">Evolução de Visitas</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[{ name: 'Mês Atual', visitas: reportData.stats.totalVisits }]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="visitas" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Add more charts here */}
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">Detalhamento de Visitas</h3>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Área</th>
                                        <th className="p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.visits.map((v: any) => (
                                        <tr key={v.id} className="border-b">
                                            <td className="p-2">{new Date(v.date).toLocaleDateString()}</td>
                                            <td className="p-2">{v.area?.name || '-'}</td>
                                            <td className="p-2">Realizada</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'PENDENCIES_REPORT':
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold mb-4">Lista de Pendências</h3>
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 border">Descrição</th>
                                    <th className="p-3 border">Responsável</th>
                                    <th className="p-3 border">Prioridade</th>
                                    <th className="p-3 border">Status</th>
                                    <th className="p-3 border">Prazo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.pendencies.map((p: any) => (
                                    <tr key={p.id} className="border-b">
                                        <td className="p-3 border">{p.description}</td>
                                        <td className="p-3 border">{p.responsible}</td>
                                        <td className={`p-3 border font-bold ${p.priority === 'ALTA' ? 'text-red-600' : 'text-yellow-600'
                                            }`}>{p.priority}</td>
                                        <td className="p-3 border">{p.status}</td>
                                        <td className="p-3 border">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'SECTOR_REPORT':
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{reportData.sector?.name}</h2>
                            <p className="text-gray-500">Relatório consolidado do setor</p>
                        </div>
                        <h3 className="text-lg font-bold mb-4">Visitas por Área</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">Data</th>
                                    <th className="p-2">Área</th>
                                    <th className="p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.visits.map((v: any) => (
                                    <tr key={v.id} className="border-b">
                                        <td className="p-2">{new Date(v.date).toLocaleDateString()}</td>
                                        <td className="p-2">{v.area?.name || '-'}</td>
                                        <td className="p-2">Realizada</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                if (reportData.metrics) {
                    return (
                        <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-6">
                                {reportData.metrics.map((m: any, i: number) => (
                                    <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
                                        <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">{m.label}</h3>
                                        <p className="text-3xl font-bold text-primary">{m.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-bold mb-2">Resumo Executivo</h3>
                                <p className="text-gray-700 leading-relaxed">{reportData.details}</p>
                            </div>
                            <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                <p className="text-gray-400">Gráficos detalhados seriam exibidos aqui.</p>
                            </div>
                        </div>
                    );
                }
                return <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(reportData, null, 2)}</pre>;
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* No-Print Header */}
            <div className="print:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="hover:bg-gray-700 p-2 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold">Visualizador de Relatório</h1>
                </div>
                <div className="flex space-x-3">
                    <button onClick={handlePrint} className="btn-primary bg-white text-primary hover:bg-gray-100 flex items-center space-x-2">
                        <Printer className="h-4 w-4" />
                        <span>Imprimir / Salvar PDF</span>
                    </button>
                </div>
            </div>

            {/* Printable Content */}
            <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
                {/* Report Header */}
                <div className="border-b-2 border-primary pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-primary uppercase tracking-wide">Relatório QS Inclusão</h1>
                        <p className="text-gray-500 mt-1 text-lg">{reportType.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                        <p>Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                        <p>QS Inclusão - Sistema de Acompanhamento</p>
                    </div>
                </div>

                {/* Report Body */}
                <div className="report-content">
                    {renderContent()}
                </div>

                {/* Report Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-400 text-sm print:fixed print:bottom-0 print:w-full print:bg-white">
                    <p>QS Inclusão - Soluções em Acessibilidade e Inclusão</p>
                    <p>www.qsinclusao.com.br</p>
                </div>
            </div>
        </div>
    );
};

export default ReportViewer;
