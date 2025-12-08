import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, CalendarClock, Check } from 'lucide-react';
import { api } from '../lib/api';
import { useCompany } from '../contexts/CompanyContext';
import DailyIframe from '@daily-co/daily-js';
import { toast } from 'sonner';

const LibrasCentral = () => {
    const { selectedCompanyId } = useCompany();
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Colaborador QS');
    const callFrameRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [roomUrl, setRoomUrl] = useState<string | null>(null);

    // Call System State
    const [callStatus, setCallStatus] = useState<'IDLE' | 'WAITING' | 'IN_PROGRESS'>('IDLE');
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);

    // Master View State
    const [pendingCalls, setPendingCalls] = useState<any[]>([]);
    const [isMaster, setIsMaster] = useState(false);

    // Invite System
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.name) setUserName(user.name);
                if (user.role === 'MASTER' || user.role === 'RH') setIsMaster(true);
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

    // Poll for call status when WAITING (Collaborator)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (callStatus === 'WAITING' && currentCallId) {
            interval = setInterval(async () => {
                try {
                    const response = await api.get(`/libras/calls/${currentCallId}/status`);
                    if (response.data.status === 'IN_PROGRESS') {
                        setCallStatus('IN_PROGRESS');
                        startCall(); // Auto-join
                    } else if (response.data.status === 'CANCELED' || response.data.status === 'FINISHED') {
                        setCallStatus('IDLE');
                        setCurrentCallId(null);
                        toast.info('Chamada encerrada ou cancelada.');
                    }
                } catch (error) {
                    console.error('Error polling status', error);
                }
            }, 3000); // Check every 3 seconds
        }

        return () => clearInterval(interval);
    }, [callStatus, currentCallId]);

    // Poll for pending calls if Master
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isMaster && !roomUrl) {
            const fetchCalls = async () => {
                try {
                    const response = await api.get('/libras/calls/pending');
                    setPendingCalls(response.data.calls);
                } catch (error) {
                    console.error('Error fetching pending calls', error);
                }
            };

            fetchCalls();
            interval = setInterval(fetchCalls, 5000);
        }

        return () => clearInterval(interval);
    }, [isMaster, roomUrl]);

    const requestInterpreter = async () => {
        try {
            setLoading(true);
            const response = await api.post('/libras/calls', {});

            if (response.data.call) {
                setCurrentCallId(response.data.call.id);
                setCallStatus('WAITING');
                toast.success('Solicitação enviada! Aguarde um intérprete.');
            } else if (response.data.message === 'Already waiting') {
                setCurrentCallId(response.data.call.id);
                setCallStatus('WAITING');
                toast.info('Você já está na fila de espera.');
            }
        } catch (error) {
            console.error('Error requesting interpreter', error);
            toast.error('Erro ao solicitar intérprete.');
        } finally {
            setLoading(false);
        }
    };

    const cancelRequest = async () => {
        if (!currentCallId) return;
        try {
            await api.put(`/libras/calls/${currentCallId}/status`, { status: 'CANCELED' });
            setCallStatus('IDLE');
            setCurrentCallId(null);
            toast.info('Solicitação cancelada.');
        } catch (error) {
            console.error('Error canceling request', error);
        }
    };

    const acceptCall = async (callId: string) => {
        try {
            await api.put(`/libras/calls/${callId}/accept`, {});
            startCall(); // Join the room
        } catch (error) {
            console.error('Error accepting call', error);
            toast.error('Erro ao atender chamada.');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCallId || !inviteEmail) return;

        try {
            await api.post(`/libras/calls/${currentCallId}/invite`, {
                email: inviteEmail,
                name: inviteName || 'Especialista'
            });
            toast.success(`Convite enviado para ${inviteEmail}`);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteName('');
        } catch (error) {
            console.error('Error sending invite', error);
            toast.error('Erro ao enviar convite.');
        }
    };

    const quickInvites = [
        { name: 'RH', email: 'rh@empresa.com' }, // Placeholder, ideally from settings
        { name: 'Médico', email: 'medico@empresa.com' },
        { name: 'Benefícios', email: 'beneficios@empresa.com' },
        { name: 'Segurança', email: 'seguranca@empresa.com' }
    ];

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
                setCallStatus('IDLE'); // Reset status when leaving

                // Ideally notify backend that call finished
                if (currentCallId) {
                    api.put(`/libras/calls/${currentCallId}/status`, { status: 'FINISHED' });
                }
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

    // Render Invite Modal
    const renderInviteModal = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Convidar Especialista</h3>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {quickInvites.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setInviteEmail(item.email)}
                            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {item.name}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="email@exemplo.com"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowInviteModal(false)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Enviar Convite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

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

    // Master View
    if (isMaster && !roomUrl) {
        return (
            <div className="h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
                <div className="bg-[#0A192F] px-6 py-4 flex items-center justify-between shadow-md z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Video className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Painel do Intérprete</h1>
                            <p className="text-xs text-blue-200">
                                {pendingCalls.length} solicitações aguardando
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Solicitações de Atendimento</h2>

                        {pendingCalls.length === 0 ? (
                            <div className="text-center py-20 bg-[#0A192F] rounded-2xl border border-gray-800">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="h-10 w-10 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Tudo tranquilo por aqui</h3>
                                <p className="text-gray-400">Nenhuma solicitação pendente no momento.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {pendingCalls.map((call) => (
                                    <div key={call.id} className="bg-[#0A192F] p-6 rounded-xl border border-blue-900/30 flex items-center justify-between hover:border-blue-500/50 transition-all">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                                                <Video className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{call.requester.name}</h3>
                                                <p className="text-sm text-blue-200">
                                                    {call.requester.collaboratorProfile?.area?.name || 'Área não informada'} •
                                                    Matrícula: {call.requester.collaboratorProfile?.matricula || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Aguardando há {Math.floor((new Date().getTime() - new Date(call.createdAt).getTime()) / 60000)} minutos
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => acceptCall(call.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 shadow-lg shadow-green-900/20"
                                        >
                                            <Video className="h-5 w-5" />
                                            <span>Atender Agora</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Collaborator View
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
                            <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${callStatus === 'IN_PROGRESS' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {callStatus === 'IN_PROGRESS' ? 'Em Atendimento' : (callStatus === 'WAITING' ? 'Aguardando Intérprete' : 'Disponível')}
                        </p>
                    </div>
                </div>
                {/* Invite Button for Master */}
                {isMaster && roomUrl && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                    >
                        <span>Convidar Especialista</span>
                    </button>
                )}
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center bg-gray-900 p-4">
                {!roomUrl ? (
                    <div className="h-full flex flex-col items-center justify-center text-center w-full max-w-4xl">

                        {callStatus === 'IDLE' && (
                            <div className="max-w-2xl w-full bg-[#0A192F] p-10 rounded-2xl shadow-2xl border border-blue-900/50">
                                <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                                    <Video className="h-12 w-12 text-blue-400" />
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-4">Central de Atendimento</h2>
                                <p className="text-blue-200 mb-8 text-lg">
                                    Solicite um intérprete agora. O vídeo só iniciará quando ele aceitar.
                                </p>

                                <button
                                    onClick={requestInterpreter}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-600/50 flex items-center justify-center space-x-3"
                                >
                                    <Video className="h-6 w-6" />
                                    <span>Solicitar Intérprete</span>
                                </button>
                            </div>
                        )}

                        {callStatus === 'WAITING' && (
                            <div className="max-w-2xl w-full bg-[#0A192F] p-10 rounded-2xl shadow-2xl border border-yellow-900/50 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-shimmer"></div>

                                <div className="w-24 h-24 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                    <CalendarClock className="h-12 w-12 text-yellow-400" />
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-4">Aguardando Intérprete...</h2>
                                <p className="text-yellow-200 mb-8 text-lg">
                                    Notificamos a central. Por favor, aguarde um momento.
                                </p>

                                <button
                                    onClick={cancelRequest}
                                    className="text-red-400 hover:text-red-300 font-medium transition-colors border border-red-900/30 hover:border-red-500/50 px-6 py-2 rounded-lg"
                                >
                                    Cancelar Solicitação
                                </button>
                            </div>
                        )}

                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black" />
                )}
            </div>
            {showInviteModal && renderInviteModal()}
        </div>
    );
};

export default LibrasCentral;
