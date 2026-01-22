import { useState, useEffect } from 'react';
import { Calendar, Clock, Coffee, Sun, Moon, Briefcase } from 'lucide-react';
import { api } from '../../lib/api';

interface CollaboratorProfile {
    shift?: string;
    matricula?: string;
    nextRestDay?: string;
    workSchedule?: {
        type?: string;
        startTime?: string;
        endTime?: string;
        breakStart?: string;
        breakEnd?: string;
    };
    area?: { name: string };
}

const MobileWorkSchedule = () => {
    const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/me');
                if (response.data.user?.collaboratorProfile) {
                    setProfile(response.data.user.collaboratorProfile);
                }
            } catch (error) {
                console.error('Error fetching schedule', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando escala...</div>;

    if (!profile) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Sem Escala</h2>
                <p className="text-gray-500 mt-2">Você não possui um perfil de colaborador ou escala vinculada.</p>
            </div>
        );
    }

    const schedule = profile.workSchedule;
    const nextRestDay = profile.nextRestDay ? new Date(profile.nextRestDay) : null;
    const today = new Date();

    // Fallback info if WorkSchedule is missing but Shift string exists
    const shiftName = schedule?.type || profile.shift || 'Padrão';

    const getShiftIcon = (start: string) => {
        if (!start) return <Sun className="h-6 w-6 text-orange-500" />;
        const hour = parseInt(start.split(':')[0]);
        if (hour >= 18 || hour < 5) return <Moon className="h-6 w-6 text-indigo-500" />;
        return <Sun className="h-6 w-6 text-orange-500" />;
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Minha Escala</h1>
                <p className="text-gray-500">Visualize seus horários e folgas</p>
            </div>

            {/* Main Shift Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Tipo de Escala</p>
                            <h2 className="text-xl font-bold text-gray-900">{shiftName}</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                {getShiftIcon(schedule?.startTime)}
                                <div>
                                    <p className="text-xs text-gray-500">Entrada</p>
                                    <p className="font-bold text-gray-900">{schedule?.startTime || '--:--'}</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-6 w-6 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Saída</p>
                                    <p className="font-bold text-gray-900">{schedule?.endTime || '--:--'}</p>
                                </div>
                            </div>
                        </div>

                        {schedule?.breakStart && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 px-2">
                                <Coffee className="h-4 w-4" />
                                <span>Intervalo: {schedule.breakStart} - {schedule.breakEnd}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Next Day Off */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-green-900/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-green-100 font-medium mb-1">Próxima Folga</p>
                        {nextRestDay ? (
                            <div>
                                <h3 className="text-3xl font-bold">
                                    {nextRestDay.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </h3>
                                <p className="text-green-100 text-sm mt-1 capitalize">
                                    {nextRestDay.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xl font-semibold">A definir</p>
                        )}
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Calendar className="h-6 w-6 text-white" />
                    </div>
                </div>

                {nextRestDay && (
                    <div className="mt-4 pt-4 border-t border-white/20 text-xs text-green-100">
                        {Math.ceil((nextRestDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Detalhes da Jornada</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Departamento</span>
                        <span className="font-medium text-gray-900">{profile.area?.name || 'Geral'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Matrícula</span>
                        <span className="font-medium text-gray-900">{profile.matricula || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-gray-500">Carga Horária</span>
                        <span className="font-medium text-gray-900">44h Semanais</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileWorkSchedule;
