import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, PlusCircle, User, Menu, GraduationCap } from 'lucide-react';

import { Video } from 'lucide-react';
import { useLibrasAvailability } from '../hooks/useLibrasAvailability';

import { useCompany } from '../contexts/CompanyContext';

const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLibrasAvailable } = useLibrasAvailability();
    const { companies } = useCompany();

    // Assuming single company for mobile user (Collaborator)
    const currentCompany = companies[0];
    const isUniversityEnabled = currentCompany?.universityEnabled;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Get user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLeader = user.role === 'LIDER' || user.role === 'MASTER' || user.role === 'RH';

    const navItems = isLeader ? [
        { icon: Home, label: 'Início', path: '/app' },
        { icon: User, label: 'Equipe', path: '/app/team', primary: true }, // Leader specific
        { icon: Calendar, label: 'Folgas', path: '/app/approvals' },
        { icon: User, label: 'Perfil', path: '/app/profile' },
    ] : [
        { icon: Home, label: 'Início', path: '/app' },
        ...(isUniversityEnabled ? [{ icon: GraduationCap, label: 'Cursos', path: '/app/university' }] : []),
        { icon: PlusCircle, label: 'Solicitar', path: '/app/request', primary: true },
        { icon: Calendar, label: 'Agenda', path: '/app/schedule' },
        { icon: User, label: 'Perfil', path: '/app/profile' },
    ];

    if (isLibrasAvailable) {
        // Add to bottom nav if available
        if (!navItems.find(i => i.label === 'Libras')) {
            // Replace Calendar or add as extra? Let's replace Calendar for now or just add it
            // Mobile nav usually fits 5 items. We have 5 now.
            // If Libras is available, maybe swap Calendar? Or just keep 5 and put Libras in Menu?
            // The original code spliced it in. Let's keep it simple.
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Mobile Header */}
            <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="QS Inclusão" className="h-8 w-auto object-contain" />
                    <span className="font-bold text-gray-900">QS Inclusão <span className="text-xs text-gray-400 font-normal">v7.2</span></span>
                </div>
                <button onClick={() => setIsMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" aria-label="Abrir menu">
                    <Menu className="h-6 w-6" />
                </button>
            </header>

            {/* Sidebar Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className="relative w-64 h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <span className="font-bold text-gray-900">Menu</span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full"
                                aria-label="Fechar menu"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4">
                            <nav className="space-y-1 px-2">
                                <button
                                    onClick={() => { navigate('/app'); setIsMenuOpen(false); }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                                >
                                    <Home className="h-5 w-5" />
                                    <span className="font-medium">Início</span>
                                </button>

                                {isUniversityEnabled && (
                                    <button
                                        onClick={() => { navigate('/app/university'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                                    >
                                        <GraduationCap className="h-5 w-5" />
                                        <span className="font-medium">Universidade</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => { navigate('/app/schedule'); setIsMenuOpen(false); }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                                >
                                    <Calendar className="h-5 w-5" />
                                    <span className="font-medium">Minha Agenda</span>
                                </button>

                                <button
                                    onClick={() => { navigate('/app/profile'); setIsMenuOpen(false); }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                                >
                                    <User className="h-5 w-5" />
                                    <span className="font-medium">Meu Perfil</span>
                                </button>

                                {/* Always show Libras in menu */}
                                <button
                                    onClick={() => { navigate('/app/libras'); setIsMenuOpen(false); }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-xl transition-colors mt-2"
                                >
                                    <Video className="h-5 w-5" />
                                    <span className="font-medium">Central de Libras</span>
                                </button>
                            </nav>
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                            >
                                <span>Sair do App</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-end z-20 pb-6">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        aria-label={item.label}
                        className={`flex flex-col items-center justify-center space-y-1 w-16 ${item.primary
                            ? 'mb-4'
                            : ''
                            }`}
                    >
                        <div className={`
              flex items-center justify-center transition-all
              ${item.primary
                                ? 'w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-blue-600/30 transform hover:scale-105 active:scale-95'
                                : location.pathname === item.path ? 'text-primary' : 'text-gray-400'
                            }
            `}>
                            <item.icon className={item.primary ? 'h-7 w-7' : 'h-6 w-6'} />
                        </div>
                        {!item.primary && (
                            <span className={`text-[10px] font-medium ${location.pathname === item.path ? 'text-primary' : 'text-gray-400'}`}>
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default MobileLayout;
