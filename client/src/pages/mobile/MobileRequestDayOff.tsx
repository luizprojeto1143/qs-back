import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const MobileRequestDayOff = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        type: 'FOLGA',
        reason: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.date || !formData.reason) {
                toast.error('Preencha todos os campos obrigatórios');
                setLoading(false);
                return;
            }

            await api.post('/days-off', {
                date: formData.date,
                type: formData.type,
                reason: formData.reason
            });

            toast.success('Solicitação enviada com sucesso!');
            navigate('/app');
        } catch (error) {
            console.error('Error submitting day off', error);
            toast.error('Erro ao enviar solicitação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Solicitar Folga</h1>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="bg-yellow-50 p-4 rounded-2xl flex items-start space-x-3 text-yellow-800 text-sm">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>Sua solicitação entrará em análise pela liderança. Entraremos em contato após avaliação.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Data da Folga</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tipo</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="FOLGA">Folga Comum</option>
                            <option value="COMPENSACAO">Compensação de Banco</option>
                            <option value="ATESTADO">Atestado Médico</option>
                            <option value="OUTRO">Outros</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Motivo / Justificativa</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <textarea
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[120px]"
                                placeholder="Explique o motivo da solicitação..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MobileRequestDayOff;
