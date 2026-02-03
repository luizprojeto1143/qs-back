import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Calendar, Clock, Video, Building, User, MessageSquare } from 'lucide-react';

const PublicInterpreterRequest = () => {
    const { companyId } = useParams();
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        requesterName: '',
        date: '',
        startTime: '',
        duration: 60,
        theme: '',
        modality: 'ONLINE',
        description: ''
    });

    useEffect(() => {
        const fetchCompany = async () => {
            if (!companyId) return;
            try {
                const response = await api.get(`/interpreter/public-config/${companyId}`);
                setCompanyName(response.data.name);
            } catch (error) {
                toast.error('Empresa não encontrada ou link inválido');
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/interpreter/public-request', {
                ...formData,
                companyId
            });
            setSuccess(true);
            toast.success('Solicitação enviada com sucesso!');
        } catch (error) {
            toast.error('Erro ao enviar solicitação');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
    }

    if (!companyName) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Link Inválido</h1>
                    <p className="text-gray-500">Não foi possível identificar a empresa para esta solicitação.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h1>
                    <p className="text-gray-500 mb-6">Sua solicitação de intérprete foi enviada com sucesso para a empresa <strong>{companyName}</strong>. Você receberá atualizações por e-mail.</p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Fazer nova solicitação
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-blue-600 p-8 text-white">
                        <h1 className="text-2xl font-bold mb-2">Solicitação de Intérprete de Libras</h1>
                        <div className="flex items-center text-blue-100">
                            <Building className="h-5 w-5 mr-2" />
                            <span>{companyName}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.requesterName}
                                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Digite seu nome"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="time"
                                        required
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <div className="relative">
                                    <Video className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <select
                                        value={formData.modality}
                                        onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="ONLINE">Online</option>
                                        <option value="PRESENCIAL">Presencial</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Assunto</label>
                            <input
                                type="text"
                                required
                                value={formData.theme}
                                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Sobre o que será o atendimento?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Detalhes</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Informações adicionais para o intérprete..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                            Enviar Solicitação
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Simple Check Icon Component for Success State
const Check = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default PublicInterpreterRequest;
