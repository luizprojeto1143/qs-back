import { AlertCircle } from 'lucide-react';

const Pendencies = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Pendências</h1>
                <button className="btn-primary flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Nova Pendência</span>
                </button>
            </div>

            <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhuma pendência</h3>
                <p className="text-gray-500">Não há pendências registradas no momento.</p>
            </div>
        </div>
    );
};

export default Pendencies;


