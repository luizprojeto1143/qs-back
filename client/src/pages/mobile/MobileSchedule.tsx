import { useState } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

const MobileSchedule = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.post('/schedules', {
                date: selectedDate,
                time: selectedTime,
                reason
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error scheduling:', error);
            alert('Erro de conexão ou ao agendar.');
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
                <p className="text-gray-500">Seu pedido de agendamento foi recebido. Em breve você receberá a confirmação.</p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setSelectedDate('');
                        setSelectedTime('');
                        setReason('');
                    }}
                    className="mt-8 btn-primary w-full"
                >
                    Nova Solicitação
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Agendar Suporte</h1>
                <p className="text-gray-500">Solicite acompanhamento presencial</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Data Desejada</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            required
                            className="pl-10 input-field w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Horário Preferencial</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="time"
                            required
                            className="pl-10 input-field w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Motivo do Agendamento</label>
                    <textarea
                        rows={4}
                        required
                        className="input-field w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Descreva brevemente o motivo..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                    Confirmar Solicitação
                </button>
            </form>
        </div>
    );
};

export default MobileSchedule;
