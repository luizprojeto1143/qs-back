import { Search, Plus, ChevronRight } from 'lucide-react';

const CollaboratorsList = () => {
    // Mock data
    const collaborators = [
        { id: 1, name: 'Lucas Almeida', sector: 'Produção', shift: 'Noturno', avatar: null },
        { id: 2, name: 'Carla Souza', sector: 'Recursos Humanos', shift: 'Diurno', avatar: null },
        { id: 3, name: 'Rafael Pereira', sector: 'Logística', shift: 'Tarde', avatar: null },
        { id: 4, name: 'Amanda Costa', sector: 'Finanças', shift: 'Diurno', avatar: null },
        { id: 5, name: 'João Silva', sector: 'Produção', shift: 'Manhã', avatar: null },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
                <button className="btn-primary flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Colaborador</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Buscar por nome, matrícula..."
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <select className="input-field min-w-[140px]">
                        <option>Setor</option>
                    </select>
                    <select className="input-field min-w-[140px]">
                        <option>Área</option>
                    </select>
                    <select className="input-field min-w-[140px]">
                        <option>Turno</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {collaborators.map((collab) => (
                        <div key={collab.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                    {collab.avatar ? (
                                        <img src={collab.avatar} alt={collab.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-500 font-medium text-lg">{collab.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">{collab.name}</h3>
                                    <p className="text-xs text-gray-500">{collab.sector} • {collab.shift}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CollaboratorsList;
