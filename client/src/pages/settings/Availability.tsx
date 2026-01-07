import { useState, useEffect } from 'react';
import { Save, Clock, Plus, Trash2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface TimeSlot {
    start: string;
    end: string;
}

interface DaySchedule {
    active: boolean;
    slots: TimeSlot[];
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

const DEFAULT_SLOT = { start: '08:00', end: '18:00' };

const Availability = () => {
    const { selectedCompanyId } = useCompany();
    const [availability, setAvailability] = useState<AvailabilityState>({
        monday: { active: true, slots: [{ ...DEFAULT_SLOT }] },
        tuesday: { active: true, slots: [{ ...DEFAULT_SLOT }] },
        wednesday: { active: true, slots: [{ ...DEFAULT_SLOT }] },
        thursday: { active: true, slots: [{ ...DEFAULT_SLOT }] },
        friday: { active: true, slots: [{ ...DEFAULT_SLOT }] },
        saturday: { active: false, slots: [] },
        sunday: { active: false, slots: [] }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedCompanyId) return;
            try {
                const response = await api.get('/settings/availability');
                const data = response.data;

                if (Object.keys(data).length > 0) {
                    // Normalize data to support multi-slots if coming from old structure
                    const normalizedData = { ...data };
                    Object.keys(normalizedData).forEach(key => {
                        if (!normalizedData[key].slots) {
                            normalizedData[key].slots = normalizedData[key].active
                                ? [{ start: normalizedData[key].start || '08:00', end: normalizedData[key].end || '18:00' }]
                                : [];
                        }
                    });
                    setAvailability(normalizedData);
                }
            } catch (error: any) {
                console.error('Error fetching availability', error);

                // EMERGENCY DEBUG: Show the exact error coming from the server
                if (error.response?.data) {
                    const serverError = error.response.data;
                    const debugMessage = `AVAILABILITY CRASH: ${serverError.message || JSON.stringify(serverError)}`;
                    alert(debugMessage); // Make sure user sees it!
                }

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

    const toggleDay = (day: string, active: boolean) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                active,
                slots: active && prev[day].slots.length === 0 ? [{ ...DEFAULT_SLOT }] : prev[day].slots
            }
        }));
    };

    const addSlot = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: [...prev[day].slots, { ...DEFAULT_SLOT }]
            }
        }));
    };

    const removeSlot = (day: string, index: number) => {
        setAvailability(prev => {
            const newSlots = prev[day].slots.filter((_, i) => i !== index);
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: newSlots,
                    active: newSlots.length > 0
                }
            };
        });
    };

    const updateSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
        setAvailability(prev => {
            const newSlots = [...prev[day].slots];
            newSlots[index] = { ...newSlots[index], [field]: value };
            return {
                ...prev,
                [day]: { ...prev[day], slots: newSlots }
            };
        });
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
                    <div key={day.key} className={`p-4 border rounded-lg transition-colors ${availability[day.key]?.active ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={availability[day.key]?.active}
                                    onChange={(e) => toggleDay(day.key, e.target.checked)}
                                    className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
                                />
                                <span className={`font-medium ${availability[day.key]?.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {day.label}
                                </span>
                            </div>
                            {availability[day.key]?.active && (
                                <button
                                    onClick={() => addSlot(day.key)}
                                    className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Adicionar Horário</span>
                                </button>
                            )}
                        </div>

                        {availability[day.key]?.active && (
                            <div className="space-y-3 pl-8">
                                {availability[day.key].slots.map((slot, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <Clock className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                                        <input
                                            type="time"
                                            value={slot.start}
                                            onChange={(e) => updateSlot(day.key, index, 'start', e.target.value)}
                                            className="input-field w-32 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        />
                                        <span className="text-gray-500 dark:text-gray-400">até</span>
                                        <input
                                            type="time"
                                            value={slot.end}
                                            onChange={(e) => updateSlot(day.key, index, 'end', e.target.value)}
                                            className="input-field w-32 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        />
                                        <button
                                            onClick={() => removeSlot(day.key, index)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remover horário"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {availability[day.key].slots.length === 0 && (
                                    <p className="text-sm text-amber-500">Nenhum horário configurado.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Availability;
