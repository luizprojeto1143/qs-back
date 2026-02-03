import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface TimeSlot {
    start: string;
    end: string;
}

interface DaySchedule {
    active: boolean;
    slots: TimeSlot[];
}

interface Availability {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const MobileSchedule = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState<Availability | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(true);

    // Fetch availability settings
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const res = await api.get('/settings/availability');
                const data = res.data || {};

                // Normalize data to ensure slots array exists
                const normalized: Availability = {};
                Object.keys(data).forEach(key => {
                    const dayData = data[key];
                    normalized[key as keyof Availability] = {
                        active: dayData.active || false,
                        slots: dayData.slots || (dayData.active ? [{ start: dayData.start || '08:00', end: dayData.end || '18:00' }] : [])
                    };
                });


                setAvailability(normalized);
            } catch {
                // Failed to load availability - continue with empty
            } finally {
                setLoadingAvailability(false);
            }
        };
        fetchAvailability();
    }, []);

    // Generate available dates for the next 30 days
    const availableDates = useMemo(() => {
        if (!availability) return [];

        const dates: { date: string; dayName: string; label: string }[] = [];
        const today = new Date();

        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const dayIndex = date.getDay();
            const dayKey = DAY_NAMES[dayIndex] as keyof Availability;
            const dayConfig = availability[dayKey];

            // Check if day is active and has slots
            if (dayConfig?.active && dayConfig.slots && dayConfig.slots.length > 0) {
                dates.push({
                    date: date.toISOString().split('T')[0],
                    dayName: dayKey,
                    label: `${date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`
                });
            }
        }

        return dates;
    }, [availability]);

    // Get available time slots for selected date
    const availableTimeSlots = useMemo(() => {
        if (!selectedDate || !availability) return [];

        const date = new Date(selectedDate + 'T12:00:00'); // Add time to avoid timezone issues
        const dayKey = DAY_NAMES[date.getDay()] as keyof Availability;
        const dayConfig = availability[dayKey];

        if (!dayConfig?.active || !dayConfig.slots || dayConfig.slots.length === 0) return [];

        const allSlots: string[] = [];

        // Generate 30-minute intervals for each configured time slot
        dayConfig.slots.forEach(slot => {
            const startHour = parseInt(slot.start.split(':')[0]);
            const startMin = parseInt(slot.start.split(':')[1]) || 0;
            const endHour = parseInt(slot.end.split(':')[0]);
            const endMin = parseInt(slot.end.split(':')[1]) || 0;

            let currentHour = startHour;
            let currentMin = startMin;

            while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                allSlots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);

                currentMin += 30;
                if (currentMin >= 60) {
                    currentMin = 0;
                    currentHour++;
                }
            }
        });

        return allSlots;
    }, [selectedDate, availability]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/schedules', {
                date: selectedDate,
                time: selectedTime,
                reason
            });
            setSubmitted(true);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string; error?: string } } };
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao agendar.';
            alert(msg);
        } finally {
            setLoading(false);
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

    if (loadingAvailability) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-gray-500">Carregando disponibilidade...</p>
            </div>
        );
    }

    if (availableDates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="h-10 w-10 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma data disponível</h2>
                <p className="text-gray-500">No momento não há dias habilitados para agendamento. Entre em contato com o RH.</p>
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
                {/* Date Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Escolha uma Data
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {availableDates.map(({ date, label }) => (
                            <button
                                key={date}
                                type="button"
                                onClick={() => {
                                    setSelectedDate(date);
                                    setSelectedTime(''); // Reset time when date changes
                                }}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${selectedDate === date
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Escolha um Horário
                        </label>
                        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                            {availableTimeSlots.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedTime === time
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Motivo do Agendamento</label>
                    <textarea
                        rows={3}
                        required
                        className="input-field w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Descreva brevemente o motivo..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!selectedDate || !selectedTime || loading}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? 'Enviando...' : 'Confirmar Solicitação'}
                </button>
            </form>
        </div>
    );
};

export default MobileSchedule;
