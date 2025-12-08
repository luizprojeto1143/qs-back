import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, CalendarClock } from 'lucide-react';
import { api } from '../lib/api';
import { useCompany } from '../contexts/CompanyContext';
import DailyIframe from '@daily-co/daily-js';

const LibrasCentral = () => {
    const { selectedCompanyId } = useCompany();
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Colaborador QS');
    const callFrameRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [roomUrl, setRoomUrl] = useState<string | null>(null);

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
                // Add timestamp to prevent caching
                const response = await api.get(`/libras/availability?t=${new Date().getTime()}`);
                setIsAvailable(response.data.available);
            } catch (error) {
                console.error('Error checking availability', error);
                setIsAvailable(false);
            } finally {
                setLoading(false);
            }
        };

        checkAvailability();
    }, [selectedCompanyId]);

    const startCall = async () => {
        if (!containerRef.current) return;

        try {
            const response = await api.post('/daily/room', {});
            const url = response.data.url;
            setRoomUrl(url);

            const callFrame = DailyIframe.createFrame(containerRef.current, {
                iframeStyle: {
                    width: '100%',
                    height: '100%',
                    border: '0',
                    borderRadius: '12px',
                },
                showLeaveButton: true,
                showFullscreenButton: true,
            });

            callFrameRef.current = callFrame;

            await callFrame.join({
                url,
                userName: userName,
                showLeaveButton: true
            });

            callFrame.on('left-meeting', () => {
                callFrame.destroy();
                setRoomUrl(null);
                callFrameRef.current = null;
            });

        } catch (error) {
            console.error('Error starting Daily call', error);
        }
    };

    useEffect(() => {
        return () => {
            if (callFrameRef.current) {
                callFrameRef.current.destroy();
            }
        };
    }, []);

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
            </div>

            <div className="flex-1 relative bg-gray-900 p-4">
                {!roomUrl ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="max-w-2xl w-full bg-[#0A192F] p-10 rounded-2xl shadow-2xl border border-blue-900/50">
                            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                                <Video className="h-12 w-12 text-blue-400" />
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-4">Central de Atendimento</h2>
                            <p className="text-blue-200 mb-8 text-lg">
                                Clique abaixo para iniciar o atendimento por vídeo com um intérprete.
                            </p>

                            <button
                                onClick={startCall}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-600/50 flex items-center justify-center space-x-3"
                            >
                                <Video className="h-6 w-6" />
                                <span>Iniciar Atendimento</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black" />
                )}
            </div>
        </div>
    );
};

export default LibrasCentral;
