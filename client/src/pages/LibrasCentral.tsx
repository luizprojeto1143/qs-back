import { useState, useEffect } from 'react';
import { Video, VideoOff, CalendarClock, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';
import { useCompany } from '../contexts/CompanyContext';
import { toast } from 'sonner';

const LibrasCentral = () => {
    const { selectedCompanyId } = useCompany();
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [roomName, setRoomName] = useState('');
    const [copied, setCopied] = useState(false);
    const [userName, setUserName] = useState('Colaborador QS');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.name) {
                    setUserName(user.name);
                }
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
    }, []);

    useEffect(() => {
        const checkAvailability = async () => {
            try {
                const response = await api.get('/libras/availability');
                setIsAvailable(response.data.available);

                if (response.data.available && selectedCompanyId) {
                    // Generate a unique room name per day per company
                    const today = new Date().toISOString().split('T')[0];
                    setRoomName(`QS-Libras-${selectedCompanyId}-${today}`);
                }
            } catch (error) {
                console.error('Error checking availability', error);
                setIsAvailable(false);
            } finally {
                setLoading(false);
            }
        };

        checkAvailability();
    }, [selectedCompanyId]);

    const handleCopyLink = () => {
        const url = `https://meet.jit.si/${roomName}#config.lobbyModeEnabled=true`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link da sala copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAvailable) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <VideoOff className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Central Indisponível</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        A Central de Libras não está disponível neste horário. Por favor, verifique os horários de atendimento configurados para sua empresa.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-primary bg-primary/5 py-2 px-4 rounded-lg">
                        <CalendarClock className="h-4 w-4" />
                        <span>Consulte a agenda de disponibilidade</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
            <div className="bg-[#0A192F] px-6 py-4 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Central de Libras</h1>
                        <p className="text-xs text-blue-200 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Ao vivo
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCopyLink}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Link da Sala'}</span>
                </button>
            </div>

            <div className="flex-1 relative">
                <iframe
                    src={`https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.lobbyModeEnabled=true&userInfo.displayName="${encodeURIComponent(userName)}"`}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    className="w-full h-full border-0"
                    title="Central de Libras"
                ></iframe>
            </div>
        </div>
    );
};

export default LibrasCentral;
