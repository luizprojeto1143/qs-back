import { useState, useEffect } from 'react';
import { Save, Clock } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface DaySchedule {
    start: string;
    end: string;
    active: boolean;
}

interface AvailabilityState {
    [key: string]: DaySchedule;
}

const DAYS = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
];

const Availability = () => {
    const { selectedCompanyId } = useCompany();
    const [availability, setAvailability] = useState<AvailabilityState>({
        monday: { start: '08:00', end: '18:00', active: true },
        tuesday: { start: '08:00', end: '18:00', active: true },
        wednesday: { start: '08:00', end: '18:00', active: true },
        thursday: { start: '08:00', end: '18:00', active: true },
        friday: { start: '08:00', end: '18:00', active: true },
        saturday: { start: '09:00', end: '13:00', active: false },
        sunday: { start: '00:00', end: '00:00', active: false }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedCompanyId) return;
            try {
                const response = await api.get('/settings/availability');
                const data = response.data;

                if (Object.keys(data).length > 0) {
                    setAvailability(data);
                }
            } catch (error) {
                console.error('Error fetching availability', error);
                toast.error('Erro ao carregar disponibilidade');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [selectedCompanyId]);

    const handleSave = async () => {
        try {
            await api.post('/settings/availability', availability);
            toast.success('Disponibilidade salva com sucesso!');
        } catch (error) {
            console.error('Error saving availability', error);
            toast.error('Erro ao salvar configurações');
        }
    };

    const handleChange = (day: string, field: keyof DaySchedule, value: any) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    if (loading) return <div className="text-gray-500 dark:text-gray-400">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disponibilidade de Horários</h1>
                    <p className="text-gray-500 dark:text-gray-400">Defina os horários disponíveis para cada dia da semana</p>
                </div>
                <button type="button" onClick={handleSave} className="btn-primary flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Salvar Configurações</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                {DAYS.map((day) => (
                    <div key={day.key} className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${availability[day.key]?.active ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}>
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={availability[day.key]?.active}
                                onChange={(e) => handleChange(day.key, 'active', e.target.checked)}
                                className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
                            />
                            <span className={`font-medium ${availability[day.key]?.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                {day.label}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className={`h-4 w-4 ${availability[day.key]?.active ? 'text-gray-400 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`} />
                            <input
                                type="time"
                                value={availability[day.key]?.start}
                                onChange={(e) => handleChange(day.key, 'start', e.target.value)}
                                disabled={!availability[day.key]?.active}
                                className={`input-field w-32 dark:bg-gray-600 dark:border-gray-500 dark:text-white ${!availability[day.key]?.active && 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}
                            />
                            <span className={availability[day.key]?.active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'}>até</span>
                            <input
                                type="time"
                                value={availability[day.key]?.end}
                                onChange={(e) => handleChange(day.key, 'end', e.target.value)}
                                disabled={!availability[day.key]?.active}
                                className={`input-field w-32 dark:bg-gray-600 dark:border-gray-500 dark:text-white ${!availability[day.key]?.active && 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Availability;
