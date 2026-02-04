import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, Video, Users, List } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface InterpreterRequest {
    id: string;
    date: string;
    startTime: string;
    duration: number;
    theme: string;
    modality: string;
    status: string;
    description?: string;
    adminNotes?: string;
    meetingLink?: string;
}

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const InterpreterRequestsPage = () => {
    const { user } = useAuth();
    const { companies } = useCompany();
    const currentCompany = companies[0]; // Assuming RH user sees their primary company
    const companyId = currentCompany?.id || user?.companyId;
    const [requests, setRequests] = useState<InterpreterRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

    // Form States
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        duration: 60,
        theme: '',
        modality: 'ONLINE',
        description: ''
    });

    const fetchRequests = async () => {
        try {
            const response = await api.get('/interpreter');
            setRequests(response.data);
        } catch (error) {
            toast.error('Erro ao carregar solicitações');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/interpreter', {
                ...formData,
                companyId: user?.companyId
            });
            toast.success('Solicitação enviada com sucesso!');
            setIsModalOpen(false);
            setFormData({
                date: '',
                startTime: '',
                duration: 60,
                theme: '',
                modality: 'ONLINE',
                description: ''
            });
            fetchRequests();
        } catch (error) {
            toast.error('Erro ao enviar solicitação');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'Aprovado';
            case 'REJECTED': return 'Rejeitado';
            case 'PENDING': return 'Pendente';
            default: return status;
        }
    };

    const calendarEvents = requests.map(req => {
        const start = new Date(`${req.date.split('T')[0]}T${req.startTime}`);
        const end = new Date(start.getTime() + req.duration * 60000);
        return {
            id: req.id,
            title: `${req.theme} (${getStatusLabel(req.status)})`,
            start,
            end,
            resource: req,
            status: req.status
        };
    });

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3788d8';
        if (event.status === 'APPROVED') backgroundColor = '#10B981';
        if (event.status === 'PENDING') backgroundColor = '#F59E0B';
        if (event.status === 'REJECTED') backgroundColor = '#EF4444';

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Central de Intérpretes</h1>
                    <p className="text-gray-500">Solicite e acompanhe agendamentos de intérpretes de Libras</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Lista"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Calendário"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nova Solicitação</span>
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[700px]">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        culture='pt-BR'
                        eventPropGetter={eventStyleGetter}
                        messages={{
                            next: "Próximo",
                            previous: "Anterior",
                            today: "Hoje",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                            agenda: "Agenda",
                            date: "Data",
                            time: "Hora",
                            event: "Evento",
                            noEventsInRange: "Sem eventos neste período."
                        }}
                        onSelectEvent={(event) => {
                            toast.info(`Tema: ${event.title}\nStatus: ${getStatusLabel(event.resource.status)}`);
                        }}
                    />
                </div>
            ) : (
                /* List */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Minhas Solicitações</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Carregando...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhuma solicitação encontrada.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tema</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {new Date(req.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {req.startTime} ({req.duration} min)
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{req.theme}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.modality === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {req.modality}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                                    {getStatusLabel(req.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.adminNotes && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Nota: {req.adminNotes}
                                                    </div>
                                                )}
                                                {req.meetingLink && (
                                                    <a href={req.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                                        Acessar Link
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Solicitar Intérprete</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                                    <input
                                        type="number"
                                        required
                                        min="15"
                                        step="15"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                                    <select
                                        value={formData.modality}
                                        onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="ONLINE">Online</option>
                                        <option value="PRESENCIAL">Presencial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Assunto</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Reunião de Equipe, Treinamento..."
                                    value={formData.theme}
                                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Detalhes</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Informações adicionais para o intérprete..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mr-3 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Enviar Solicitação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterpreterRequestsPage;
