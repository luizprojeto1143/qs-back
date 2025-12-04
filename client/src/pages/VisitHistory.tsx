import { Search, Filter, Calendar, MapPin, User } from 'lucide-react';

const VisitHistory = () => {
    const visits = [
        {
            id: 1,
            company: 'Tech Solutions',
            area: 'Desenvolvimento',
            collaborator: 'João Silva',
            date: '04/12/2023',
            status: 'Concluído',
            author: 'Maria (Líder)'
        },
        {
            id: 2,
            company: 'Tech Solutions',
            area: 'RH',
            collaborator: 'Ana Santos',
            date: '03/12/2023',
            status: 'Pendente',
            author: 'Carlos (Master)'
        },
        {
            id: 3,
            company: 'Logística Express',
            area: 'Operações',
            collaborator: 'Pedro Oliveira',
            date: '01/12/2023',
            status: 'Concluído',
            author: 'Fernanda (Líder)'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Visitas</h1>
                    <p className="text-gray-500">Registro completo de acompanhamentos</p>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button className="btn-secondary flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {visits.map((visit) => (
                    <div key={visit.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{visit.company}</h3>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {visit.area}
                                        </span>
                                        <span className="flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            {visit.collaborator}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${visit.status === 'Concluído' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {visit.status}
                                </span>
                                <p className="text-xs text-gray-400 mt-2">Registrado por {visit.author}</p>
                                <p className="text-xs text-gray-400">{visit.date}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisitHistory;
