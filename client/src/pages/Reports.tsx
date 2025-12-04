import { useState } from 'react';
import { FileText, Download, Filter, Loader } from 'lucide-react';

const Reports = () => {
    const [generating, setGenerating] = useState(false);

    const handleGenerateReport = async (type: string) => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type })
            });

            const data = await response.json();

            if (data.success) {
                // Simulate download by creating a blob from the JSON data
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                alert('Relatório gerado e baixado com sucesso!');
            } else {
                alert('Erro ao gerar relatório.');
            }
        } catch (error) {
            console.error('Error generating report', error);
            alert('Erro ao gerar relatório.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatórios e Documentos</h1>
                    <p className="text-gray-500">Acesse e exporte dados do sistema</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleGenerateReport('GENERAL')}
                        disabled={generating}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                    >
                        {generating ? <Loader className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        <span>{generating ? 'Gerando...' : 'Gerar Relatório Geral'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhum relatório arquivado</h3>
                <p className="text-gray-500">Gere um novo relatório para visualizar os dados.</p>
            </div>
        </div>
    );
};

export default Reports;
