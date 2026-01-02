import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, TrendingUp, AlertCircle } from 'lucide-react';
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

    console.log('DEBUG REPORT DATA:', reportData);
    console.log('AVATAR URL:', reportData.collaborator?.user?.avatar);

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

            case 'EXECUTIVE_SUMMARY':
                return (
                    <div className="space-y-8">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h2 className="text-2xl font-bold text-blue-900 mb-2">Relatório Executivo Anual</h2>
                            <p className="text-blue-700">Visão estratégica e consolidada dos indicadores de inclusão.</p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-500 uppercase">Total de Atendimentos</h3>
                                <p className="text-4xl font-bold text-primary mt-2">{reportData.metrics?.totalVisits || 0}</p>
                            </div>
                            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-500 uppercase">Eficiência de Resolução</h3>
                                <p className="text-4xl font-bold text-green-600 mt-2">{reportData.metrics?.resolutionRate || '0'}%</p>
                            </div>
                            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-500 uppercase">Satisfação Média</h3>
                                <p className="text-4xl font-bold text-purple-600 mt-2">{reportData.metrics?.satisfaction || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Manual Input Fields */}
                        <div className="space-y-6 print:space-y-4">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Oportunidades de Melhoria
                                </h3>
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] print:border-none print:p-0 print:resize-none"
                                    placeholder="Descreva as oportunidades identificadas..."
                                    defaultValue={reportData.opportunities}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tratativa</h3>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] print:border-none print:p-0 print:resize-none"
                                        placeholder="Ações propostas..."
                                    />
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Justificativa</h3>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] print:border-none print:p-0 print:resize-none"
                                        placeholder="Por que essa tratativa foi escolhida?"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Situação Atual</h3>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] print:border-none print:p-0 print:resize-none"
                                        placeholder="Status atual..."
                                    />
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Prazo de Execução</h3>
                                    <input
                                        type="text"
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent print:border-none print:p-0"
                                        placeholder="Ex: 30 dias, Até Dezembro/2024..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'INCLUSION_DIAGNOSIS':
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const isRH = user.role === 'RH';
                const isMaster = user.role === 'MASTER';

                return (
                    <div className="space-y-6">
                        {isRH && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700 font-bold">
                                            Relatório em Andamento
                                        </p>
                                        <p className="text-xs text-yellow-600 mt-1">
                                            Este diagnóstico ainda não foi finalizado. Algumas informações podem estar incompletas.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Diagnóstico de Inclusão</h2>
                            {isMaster && (
                                <button className="btn-primary text-sm" onClick={() => navigate('/dashboard/inclusion-diagnosis')}>
                                    Editar Diagnóstico
                                </button>
                            )}
                        </div>

                        {/* Render dynamic content based on reportData */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(reportData.categories || {}).map(([key, value]: [string, any]) => (
                                <div key={key} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold capitalize mb-2">{key.replace(/_/g, ' ')}</h3>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${value.score || 0}%` }}></div>
                                    </div>
                                    <p className="text-sm text-gray-600">{value.notes || 'Sem observações.'}</p>
                                </div>
                            ))}
                            {Object.keys(reportData.categories || {}).length === 0 && (
                                <p className="text-gray-500 col-span-2 text-center py-8">Nenhum dado de diagnóstico registrado.</p>
                            )}
                        </div>
                    </div>
                );

            case 'AREA_REPORT':
                return (
                    <div className="space-y-6">
                        {reportData.area ? (
                            <>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">{reportData.area.name}</h2>
                                    <p className="text-gray-500">Setor: {reportData.area.sector?.name}</p>
                                </div>
                                <h3 className="text-lg font-bold mb-4">Visitas Realizadas</h3>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2">Data</th>
                                            <th className="p-2">Responsável</th>
                                            <th className="p-2 w-1/2">Registro do Acompanhamento</th>
                                            <th className="p-2 text-center">Pendências</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.visits.map((v: any) => (
                                            <tr key={v.id} className="border-b align-top">
                                                <td className="p-2 whitespace-nowrap">{new Date(v.date).toLocaleDateString()}</td>
                                                <td className="p-2 whitespace-nowrap">{v.master?.name || '-'}</td>
                                                <td className="p-2">
                                                    {v.observacoesMaster ? (
                                                        <div className="whitespace-pre-wrap mb-2">{v.observacoesMaster}</div>
                                                    ) : null}

                                                    {v.notes && v.notes.length > 0 && (
                                                        <div className="mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                                                            <p className="text-xs font-bold text-gray-500 mb-1">Notas Individuais:</p>
                                                            <ul className="space-y-1">
                                                                {v.notes.map((n: any, i: number) => (
                                                                    <li key={i} className="text-xs text-gray-600">
                                                                        <span className="font-semibold">{n.collaborator?.user?.name}:</span> {n.content}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {!v.observacoesMaster && (!v.notes || v.notes.length === 0) && (
                                                        <span className="text-gray-400 italic">Sem registros adicionais</span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {v.generatedPendencies?.length > 0 ? (
                                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                                                            {v.generatedPendencies.length}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <div className="space-y-8">
                                <h2 className="text-xl font-bold">Relatório Geral de Áreas</h2>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2">Área</th>
                                            <th className="p-2">Setor</th>
                                            <th className="p-2">Total de Visitas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.areas?.map((area: any) => {
                                            const visitCount = reportData.visits?.filter((v: any) => v.areaId === area.id).length || 0;
                                            return (
                                                <tr key={area.id} className="border-b">
                                                    <td className="p-2">{area.name}</td>
                                                    <td className="p-2">{area.sector?.name}</td>
                                                    <td className="p-2">{visitCount}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );

            case 'LEADERSHIP_REPORT':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold mb-6">Relatório de Liderança (Por Setor e Área)</h2>
                        {Object.entries(reportData.groupedData || {}).map(([sectorName, areas]: [string, any]) => (
                            <div key={sectorName} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold text-primary mb-4 border-b pb-2">{sectorName}</h3>
                                <div className="space-y-6">
                                    {Object.entries(areas).map(([areaName, scores]: [string, any]) => {
                                        const avgScore = scores.reduce((a: any, b: any) => a + b.score, 0) / scores.length;
                                        return (
                                            <div key={areaName} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                                <div>
                                                    <p className="font-bold text-gray-900">{areaName}</p>
                                                    <p className="text-sm text-gray-500">{scores.length} avaliações</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-blue-600">{avgScore.toFixed(1)}</p>
                                                    <p className="text-xs text-gray-400">Média</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {Object.keys(reportData.groupedData || {}).length === 0 && (
                            <p className="text-gray-500 text-center">Nenhuma avaliação de liderança registrada.</p>
                        )}
                    </div>
                );

            case 'AREA_EVOLUTION':
                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Evolução da Área: {reportData.areaName}</h2>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {reportData.month}/{reportData.year}
                            </span>
                        </div>

                        <div className="h-96 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-4">Média das Avaliações</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#4F46E5" name="Nota Média" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold mb-4">Pontos Fortes</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    {reportData.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>) || <p>Nenhum ponto forte destacado.</p>}
                                </ul>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold mb-4">Pontos de Atenção</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    {reportData.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>) || <p>Nenhum ponto de atenção destacado.</p>}
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'COLLABORATOR_HISTORY':
                return (
                    <div className="space-y-8">
                        {/* Collaborator Profile Header */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex items-center space-x-6">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 overflow-hidden">
                                {reportData.collaborator?.user?.avatar ? (
                                    <img src={reportData.collaborator.user.avatar} alt={reportData.collaborator.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    reportData.collaborator?.user?.name?.charAt(0) || 'C'
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{reportData.collaborator?.user?.name}</h2>
                                <p className="text-gray-500">{reportData.collaborator?.user?.email}</p>
                                <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Matrícula: {reportData.collaborator?.matricula || '-'}</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Área: {reportData.collaborator?.area?.name || '-'}</span>
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Turno: {reportData.collaborator?.shift || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Visit History Timeline */}
                        <div>
                            <h3 className="text-xl font-bold mb-6 border-b pb-2">Histórico de Visitas e Acompanhamentos</h3>
                            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
                                {reportData.visits?.map((visit: any) => (
                                    <div key={visit.id} className="mb-8 ml-6 relative">
                                        <div className="absolute -left-10 mt-1.5 w-8 h-8 bg-primary rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-bold text-lg text-gray-900">Visita de Acompanhamento</p>
                                                    <p className="text-sm text-gray-500">Realizada por: {visit.master?.name || 'Master QS'}</p>
                                                </div>
                                                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                    {new Date(visit.date).toLocaleDateString()} às {new Date(visit.date).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            {/* Context Badge if not direct participant */}
                                            {!visit.collaborators?.some((c: any) => c.id === reportData.collaborator.id) && (
                                                <div className="mb-4">
                                                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded inline-flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Vínculo: Nota ou Pendência
                                                    </span>
                                                </div>
                                            )}

                                            {/* Visit Content */}
                                            <div className="space-y-4">
                                                {visit.notes && visit.notes.length > 0 && (
                                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                                        <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Nota Individual</p>
                                                        <p className="text-yellow-900 text-sm">{visit.notes[0].content}</p>
                                                    </div>
                                                )}
                                                {visit.relatoColaborador && (
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                                        <p className="text-xs font-bold text-green-700 uppercase mb-1">Relato do Colaborador (Geral)</p>
                                                        <p className="text-green-900 text-sm">{visit.relatoColaborador}</p>
                                                    </div>
                                                )}
                                                {visit.observacoesMaster && (
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observações do Master</p>
                                                        <p className="text-gray-700 text-sm">{visit.observacoesMaster}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!reportData.visits || reportData.visits.length === 0) && (
                                    <p className="ml-6 text-gray-500 italic">Nenhuma visita registrada.</p>
                                )}
                            </div>
                        </div>

                        {/* Pendencies */}
                        <div>
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">Pendências Relacionadas</h3>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 border">Data</th>
                                        <th className="p-3 border">Descrição</th>
                                        <th className="p-3 border">Prioridade</th>
                                        <th className="p-3 border">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.pendencies?.map((p: any) => (
                                        <tr key={p.id} className="border-b">
                                            <td className="p-3 border">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="p-3 border">{p.description}</td>
                                            <td className={`p-3 border font-bold ${p.priority === 'ALTA' ? 'text-red-600' : 'text-yellow-600'}`}>{p.priority}</td>
                                            <td className="p-3 border">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'RESOLVIDA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!reportData.pendencies || reportData.pendencies.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-gray-500 italic">Nenhuma pendência registrada.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'VISIT_INDIVIDUAL':
                return (
                    <div className="space-y-8">
                        {/* Visit Details Header */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold">Data da Visita</p>
                                    <p className="text-lg font-medium">{new Date(reportData.date).toLocaleDateString()} às {new Date(reportData.date).toLocaleTimeString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold">Área / Setor</p>
                                    <p className="text-lg font-medium">{reportData.area?.name} / {reportData.area?.sectorId ? 'Setor ' + reportData.area.sectorId.substring(0, 8) : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold">Master Responsável</p>
                                    <p className="text-lg font-medium">{reportData.master?.name || 'Master QS'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold">Empresa</p>
                                    <p className="text-lg font-medium">{reportData.company?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Collaborators Involved */}
                        <div>
                            <h3 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Colaboradores Acompanhados
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reportData.collaborators?.map((c: any) => (
                                    <div key={c.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <p className="font-bold text-lg">{c.user?.name}</p>
                                        <p className="text-sm text-gray-500">Matrícula: {c.matricula || '-'}</p>
                                        <p className="text-sm text-gray-500">Turno: {c.shift}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* General Reports */}
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="text-lg font-bold text-blue-900 mb-2">Relato da Liderança</h3>
                                <p className="text-blue-800 whitespace-pre-wrap">{reportData.relatoLideranca || 'Nenhum relato registrado.'}</p>
                            </div>

                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <h3 className="text-lg font-bold text-green-900 mb-2">Relato do Colaborador (Geral)</h3>
                                <p className="text-green-800 whitespace-pre-wrap">{reportData.relatoColaborador || 'Nenhum relato registrado.'}</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Observações do Master</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{reportData.observacoesMaster || 'Nenhuma observação registrada.'}</p>
                            </div>
                        </div>

                        {/* Individual Notes (History) */}
                        {reportData.notes && reportData.notes.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 border-b pb-2 mt-8">Notas Individuais (Histórico)</h3>
                                <div className="space-y-4">
                                    {reportData.notes.map((note: any) => (
                                        <div key={note.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-yellow-900">{note.collaborator?.user?.name}</p>
                                                <span className="text-xs text-yellow-600">{new Date(note.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-yellow-800">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generated Pendencies */}
                        {reportData.generatedPendencies && reportData.generatedPendencies.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 border-b pb-2 mt-8">Pendências Geradas</h3>
                                <div className="overflow-x-auto">
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
                                            {reportData.generatedPendencies.map((p: any) => (
                                                <tr key={p.id} className="border-b">
                                                    <td className="p-3 border">{p.description}</td>
                                                    <td className="p-3 border">{p.responsible}</td>
                                                    <td className={`p-3 border font-bold ${p.priority === 'ALTA' ? 'text-red-600' : p.priority === 'MEDIA' ? 'text-yellow-600' : 'text-blue-600'}`}>{p.priority}</td>
                                                    <td className="p-3 border">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'RESOLVIDA' || p.status === 'CONCLUIDA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 border">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {reportData.attachments && reportData.attachments.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 border-b pb-2 mt-8">Anexos</h3>
                                <ul className="list-disc list-inside">
                                    {reportData.attachments.map((att: any, index: number) => (
                                        <li key={index} className="text-blue-600 underline cursor-pointer">
                                            <a href={att.url} target="_blank" rel="noopener noreferrer">Anexo {index + 1}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
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
