import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

const SAVED_EMAIL_KEY = 'qs_saved_email';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [totpCode, setTotpCode] = useState('');
    const [require2FA, setRequire2FA] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Load saved email on mount (password is NEVER stored for security)
    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
            if (savedEmail) setEmail(savedEmail);
        } catch (e) {
            console.error('Error loading saved email', e);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: { email: string; password: string; rememberMe: boolean; totpCode?: string } = {
                email: email.trim().toLowerCase(),
                password,
                rememberMe
            };
            if (require2FA && totpCode) payload.totpCode = totpCode;

            const response = await api.post('/auth/login', payload);
            const data = response.data;

            if (data.require2fa) {
                setRequire2FA(true);
                toast.info('Autenticação em 2 etapas necessária. Digite o código do seu app autenticador.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Save or clear email based on rememberMe (NEVER save password)
            if (rememberMe) {
                localStorage.setItem(SAVED_EMAIL_KEY, email);
            } else {
                localStorage.removeItem(SAVED_EMAIL_KEY);
            }

            toast.success(`Bem-vindo(a), ${data.user.name}!`);

            // Redirect based on role
            switch (data.user.role) {
                case 'MASTER':
                    window.location.href = '/dashboard';
                    break;
                case 'RH':
                    navigate('/rh');
                    break;
                case 'COLABORADOR':
                case 'LIDER':
                    navigate('/app');
                    break;
                default:
                    navigate('/dashboard');
            }
        } catch (error) {
            // Log error only in development
            if (import.meta.env.DEV) {
                console.error('Login error:', error);
            }

            const err = error as { response?: { data?: { error?: string } }; message?: string };
            const msg = err.response?.data?.error || err.message || 'Erro ao fazer login';
            toast.error(msg);
            if (msg.includes('Invalid 2FA')) {
                setTotpCode(''); // Clear invalid code
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <img src="/logo-new.jpg" alt="QS Inclusão" className="h-12 w-auto" />
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                        Transformando a<br />
                        <span className="text-blue-200">inclusão</span> em<br />
                        resultados
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md">
                        Gerencie colaboradores, visitas técnicas, pendências e muito mais em uma única plataforma intuitiva.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-white font-medium">Gestão completa de visitas técnicas</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-white font-medium">Acompanhamento de colaboradores PCD</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-white font-medium">Central de Libras com videochamadas</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="text-white font-medium">Universidade Corporativa integrada</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-blue-200 text-sm">
                    © 2026 QS Inclusão. Todos os direitos reservados.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <div className="p-3 bg-blue-600 rounded-2xl mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">QS Inclusão</h1>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h2>
                            <p className="text-gray-500 mt-2">Entre com suas credenciais para continuar</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">E-mail</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {require2FA && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <label className="text-sm font-medium text-gray-700">Código 2FA (Autenticador)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={totpCode}
                                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white tracking-widest text-center font-mono text-lg"
                                            placeholder="000 000"
                                            required={require2FA}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">Digite o código de 6 dígitos do seu app autenticador.</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Senha</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-600">Manter conectado</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => toast.info('Por favor, entre em contato com o administrador para redefinir sua senha.')}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <>
                                        Entrar
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500">
                                Novo na plataforma?{' '}
                                <button
                                    onClick={() => toast.info('Entre em contato com o administrador para criar sua conta.')}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Solicite acesso
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-gray-400">
                        <div className="flex items-center gap-2 text-xs">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Conexão Segura
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Dados Protegidos
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
