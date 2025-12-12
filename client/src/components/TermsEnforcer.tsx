import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Term {
    id: string;
    content: string;
    version: string;
}

export const TermsEnforcer: React.FC = () => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            // Only check if logged in
            if (!localStorage.getItem('token')) return;

            // Avoid checking on login page
            if (window.location.pathname === '/login') return;

            try {
                const response = await api.get('/settings/terms/status');
                const { accepted, latestTerm } = response.data;

                if (!accepted && latestTerm) {
                    setTerm(latestTerm);
                    setShowModal(true);
                }
            } catch (error) {
                console.error('Error checking terms status', error);
            }
        };

        checkStatus();
        window.addEventListener('auth:login', checkStatus);
        return () => window.removeEventListener('auth:login', checkStatus);
    }, []);

    const handleAccept = async () => {
        if (!term) return;
        setLoading(true);
        try {
            await api.post('/settings/terms/accept', {
                termId: term.id,
                userAgent: navigator.userAgent
            });
            toast.success('Termos aceitos com sucesso!');
            setShowModal(false);
        } catch (error) {
            console.error('Error accepting terms', error);
            toast.error('Erro ao aceitar termos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!showModal || !term) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col transition-all duration-300 ${expanded ? 'h-[80vh]' : 'h-auto'}`}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Termos de Uso</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Versão {term.version}</p>
                    </div>
                </div>

                {expanded ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                            {term.content}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Para continuar acessando o sistema, é necessário aceitar os novos termos de uso.
                        </p>
                        <button
                            onClick={() => setExpanded(true)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                            Clique aqui para ler os termos completos
                        </button>
                    </div>
                )}

                <div className="p-6 bg-white dark:bg-gray-800 rounded-b-2xl">
                    <div className="flex flex-col gap-3">
                        {expanded && (
                            <button
                                onClick={() => setExpanded(false)}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-center mb-2"
                            >
                                Recolher termos
                            </button>
                        )}
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center space-x-2 py-3 text-lg"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Li e aceito os termos de uso</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
