import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            const data = response.data;

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            switch (data.user.role) {
                case 'MASTER':
                    // Force reload to ensure CompanyContext initializes
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
        } catch (error: any) {
            console.error('Login error', error);
            toast.error(error.message || 'Erro ao fazer login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <img src="/logo.png" alt="QS Inclusão" className="h-16 w-auto object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">QS Inclusão</h1>
                    <p className="text-gray-500 text-sm mt-1">Entre para acessar o sistema</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Usuário</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                    >
                        Entrar
                    </button>

                    <div className="text-center">
                        <button type="button" onClick={() => toast.info('Por favor, entre em contato com o administrador para redefinir sua senha.')} className="text-sm text-gray-500 hover:text-primary transition-colors">
                            Esqueceu sua senha?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
