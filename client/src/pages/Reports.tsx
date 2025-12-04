import { FileText, Download, Filter } from 'lucide-react';

const Reports = () => {
    const reports = [
        { id: 1, title: 'Relatório Geral de Inclusão', date: '01/12/2023', type: 'PDF', size: '2.4 MB' },
        { id: 2, title: 'Acompanhamento Mensal - Novembro', date: '30/11/2023', type: 'XLSX', size: '1.1 MB' },
        { id: 3, title: 'Pendências Resolvidas', date: '28/11/2023', type: 'PDF', size: '856 KB' },
        { id: 4, title: 'Censo de Diversidade 2023', date: '15/11/2023', type: 'PDF', size: '4.2 MB' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatórios e Documentos</h1>
                    <p className="text-gray-500">Acesse e exporte dados do sistema</p>
                </div>
                <div className="flex space-x-3">
                    <button className="btn-secondary flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span>Filtrar</span>
                    </button>
                    <button className="btn-primary flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Novo Relatório</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome do Arquivo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data de Geração</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamanho</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <span className="font-medium text-gray-900">{report.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{report.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.type === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{report.size}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-primary transition-colors">
                                            <Download className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
