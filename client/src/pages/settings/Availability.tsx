import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const Availability = () => {
    const [availability, setAvailability] = useState({
        weekdays: { start: '08:00', end: '18:00', active: true },
        saturday: { start: '09:00', end: '13:00', active: false },
        sunday: { start: '00:00', end: '00:00', active: false }
    });

    useEffect(() => {
        const saved = localStorage.getItem('availability');
        if (saved) setAvailability(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        localStorage.setItem('availability', JSON.stringify(availability));
        alert('Disponibilidade salva com sucesso!');
    };

    const handleChange = (day: string, field: string, value: any) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day as keyof typeof prev], [field]: value }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Disponibilidade de Horários</h1>
                    <p className="text-gray-500">Defina os horários disponíveis para agendamentos</p>
                </div>
                <button onClick={handleSave} className="btn-primary flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Salvar Configurações</span>
                </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                {/* Weekdays */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={availability.weekdays.active}
                            onChange={(e) => handleChange('weekdays', 'active', e.target.checked)}
                            className="h-5 w-5 text-primary rounded focus:ring-primary"
                        />
                        <span className="font-medium text-gray-900">Segunda a Sexta</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="time"
                            value={availability.weekdays.start}
                            onChange={(e) => handleChange('weekdays', 'start', e.target.value)}
                            disabled={!availability.weekdays.active}
                            className="input-field w-32"
                        />
                        <span className="text-gray-400">até</span>
                        <input
                            type="time"
                            value={availability.weekdays.end}
                            onChange={(e) => handleChange('weekdays', 'end', e.target.value)}
                            disabled={!availability.weekdays.active}
                            className="input-field w-32"
                        />
                    </div>
                </div>

                {/* Saturday */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={availability.saturday.active}
                            onChange={(e) => handleChange('saturday', 'active', e.target.checked)}
                            className="h-5 w-5 text-primary rounded focus:ring-primary"
                        />
                        <span className="font-medium text-gray-900">Sábado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="time"
                            value={availability.saturday.start}
                            onChange={(e) => handleChange('saturday', 'start', e.target.value)}
                            disabled={!availability.saturday.active}
                            className="input-field w-32"
                        />
                        <span className="text-gray-400">até</span>
                        <input
                            type="time"
                            value={availability.saturday.end}
                            onChange={(e) => handleChange('saturday', 'end', e.target.value)}
                            disabled={!availability.saturday.active}
                            className="input-field w-32"
                        />
                    </div>
                </div>

                {/* Sunday */}
                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={availability.sunday.active}
                            onChange={(e) => handleChange('sunday', 'active', e.target.checked)}
                            className="h-5 w-5 text-primary rounded focus:ring-primary"
                        />
                        <span className="font-medium text-gray-900">Domingo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="time"
                            value={availability.sunday.start}
                            onChange={(e) => handleChange('sunday', 'start', e.target.value)}
                            disabled={!availability.sunday.active}
                            className="input-field w-32"
                        />
                        <span className="text-gray-400">até</span>
                        <input
                            type="time"
                            value={availability.sunday.end}
                            onChange={(e) => handleChange('sunday', 'end', e.target.value)}
                            disabled={!availability.sunday.active}
                            className="input-field w-32"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Availability;
