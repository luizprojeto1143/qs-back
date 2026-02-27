import { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Check, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const SecuritySettings = () => {
    const [status, setStatus] = useState<'disabled' | 'setup' | 'enabled'>('disabled');
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [token, setToken] = useState('');

    const fetchStatus = async () => {
        try {
            // Since we don't have a direct status endpoint yet, we rely on the user object in localstorage or fetch /me
            // For now, let's fetch /me
            const response = await api.get('/auth/me');
            setStatus(response.data.user.twoFactorEnabled ? 'enabled' : 'disabled');
        } catch (error) {
            console.error('Error fetching status', error);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSetup = async () => {
        setLoading(true);
        try {
            const response = await api.post('/auth/2fa/setup');
            setQrCode(response.data.qrCode);
            setSecret(response.data.secret);
            setStatus('setup');
        } catch (error) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Erro ao iniciar configuração');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/2fa/verify', { token });
            toast.success('Autenticação em 2 fatores ativada!');
            setStatus('enabled');
            setToken('');
            setQrCode('');
        } catch (error) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!confirm('Tem certeza que deseja desativar a autenticação em 2 fatores? Isso reduzirá a segurança da sua conta.')) return;
        setLoading(true);
        try {
            await api.post('/auth/2fa/disable');
            toast.success('Autenticação em 2 fatores desativada.');
            setStatus('disabled');
        } catch (error) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Erro ao desativar 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Shield className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Segurança</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-gray-400" />
                            Autenticação em 2 Fatores (2FA)
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                            Adicione uma camada extra de segurança à sua conta exigindo um código do seu aplicativo autenticador (Google Authenticator, Authy, etc) ao fazer login.
                        </p>
                    </div>
                    <div className="flex items-center">
                        {status === 'enabled' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                <Check className="h-4 w-4 mr-1.5" />
                                Ativado
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Desativado
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                    {status === 'disabled' && (
                        <div>
                            <button
                                onClick={handleSetup}
                                disabled={loading}
                                className="btn-primary flex items-center space-x-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                <span>Configurar 2FA</span>
                            </button>
                        </div>
                    )}

                    {status === 'setup' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 w-fit">
                                        {qrCode && <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        <p className="font-medium mb-1">Passo 1: Escaneie o QR Code</p>
                                        <p>Abra seu aplicativo autenticador e escaneie o código acima. Se preferir, digite o código manual:</p>
                                        <code className="block mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs select-all">
                                            {secret}
                                        </code>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <form onSubmit={handleVerify} className="max-w-xs">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Passo 2: Verifique o código</p>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                className="input-field text-center tracking-widest font-mono text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={loading || token.length !== 6}
                                                className="w-full btn-primary"
                                            >
                                                {loading ? 'Verificando...' : 'Ativar 2FA'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatus('disabled')}
                                                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'enabled' && (
                        <div className="mt-4">
                            <button
                                onClick={handleDisable}
                                disabled={loading}
                                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                {loading ? 'Desativando...' : 'Desativar Autenticação em 2 Fatores'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
