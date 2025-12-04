import { AlertCircle } from 'lucide-react';

const Pendencies = () => {
    // Mock data
    const pendencies = [
        { id: 1, description: 'Instalar software de acessibilidade', responsible: 'Clara Andrade', deadline: '28/04/2024', status: 'PENDENTE' },
        { id: 2, description: 'Realizar ajustes na estação de trabalho', responsible: 'Lucas Costa', deadline: '25/04/2024', status: 'PENDENTE' },
        { id: 3, description: 'Providenciar material em braile', responsible: 'Fernanda Nunes', deadline: '24/04/2024', status: 'PENDENTE' },
        { id: 4, description: 'Agendar reunião de feedback', responsible: 'Rafael Martins', deadline: '24/04/2024', status: 'RESOLVIDA' },
        { id: 5, description: 'Consertar rampa de acesso', responsible: 'Ana Souza', deadline: '22/04/2024', status: 'PENDENTE' },
        { id: 6, description: 'Verificar sinalização tátil', responsible: 'Hugo Almeida', deadline: '22/04/2024', status: 'RESOLVIDA' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-blue-100 text-blue-700';
            case 'RESOLVIDA': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Pendências</h1>
                <button className="btn-primary flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Nova Pendência</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 overflow-x-auto">
                <select className="input-field min-w-[150px]">
                    <option>Setor</option>
                </select>
                <select className="input-field min-w-[150px]">
                    <option>Área</option>
                </select>
                <select className="input-field min-w-[150px]">
                    <option>Colaborador</option>
                </select>
                <select className="input-field min-w-[150px]">
                    <option>Prioridade</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsável</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prazo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendencies.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.description}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.responsible}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.deadline}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-primary hover:text-blue-700 text-sm font-medium">Editar</button>
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

export default Pendencies;
