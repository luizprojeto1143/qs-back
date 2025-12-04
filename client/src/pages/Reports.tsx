import { FileText, Download, Filter } from 'lucide-react';

const Reports = () => {
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

            <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhum relatório disponível</h3>
                <p className="text-gray-500">Não há relatórios gerados no momento.</p>
            </div>
        </div>
    );
};

export default Reports;
