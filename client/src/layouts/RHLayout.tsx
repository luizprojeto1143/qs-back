import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    FileText,
    LogOut,
    Menu,
    X,
    Calendar,
    Video,
    GraduationCap,
    AlertTriangle,
    Activity,
    Megaphone,
    Rss
} from 'lucide-react';
import { useLibrasAvailability } from '../hooks/useLibrasAvailability';

import { SidebarItem } from '../components/SidebarItem';

import { useCompany } from '../contexts/CompanyContext';
import { InstallButton } from '../components/InstallButton';

const RHLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { isLibrasAvailable } = useLibrasAvailability();
    const { companies } = useCompany();
    const navigate = useNavigate();

    // Protect Route based on Role
    React.useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'MASTER') {
                    navigate('/dashboard', { replace: true });
                } else if (user.role === 'COLABORADOR' || user.role === 'LIDER') {
                    navigate('/app', { replace: true });
                }
            } catch (e) {
                console.error('Invalid user data', e);
            }
        }
    }, [navigate]);

    // Assuming single company for RH user
    const currentCompany = companies[0];
    const isUniversityEnabled = currentCompany?.universityEnabled;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Visão Geral', path: '/rh' },
        { icon: Users, label: 'Colaboradores', path: '/rh/collaborators' },
        { icon: ClipboardList, label: 'Histórico de Visitas', path: '/rh/visits' },
        { icon: AlertTriangle, label: 'Pendências', path: '/rh/pendencies' },
        { icon: Rss, label: 'Feed Acessível', path: '/rh/feed' },
        ...(currentCompany?.systemSettings?.rhCanSeeQSScore ? [{ icon: Activity, label: 'Diagnóstico & Score', path: '/rh/inclusion' }] : []),
        ...(currentCompany?.systemSettings?.complaintsEnabled ? [{ icon: Megaphone, label: 'Ouvidoria', path: '/rh/complaints' }] : []),
        { icon: FileText, label: 'Relatórios', path: '/rh/reports' },
        ...(isUniversityEnabled ? [{ icon: GraduationCap, label: 'Universidade', path: '/rh/university-reports' }] : []),
        { icon: Calendar, label: 'Agendamentos', path: '/rh/schedules' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-[#0A192F] border-r border-gray-800 fixed h-full z-10 text-white">
                <div className="p-6 flex items-center justify-center">
                    <img src="/logo-new.jpg" alt="QS Inclusão" className="h-12 w-auto object-contain" />
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path || (item.path !== '/rh' && location.pathname.startsWith(item.path))}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    ))}

                    {isLibrasAvailable && (
                        <SidebarItem
                            icon={Video}
                            label="Central de Libras"
                            path="/rh/libras"
                            active={location.pathname === '/rh/libras'}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-blue-400 animate-pulse"
                        />
                    )}
                </nav>

                <div className="p-4 border-t border-gray-800 space-y-2">
                    <InstallButton
                        className="w-full px-4 py-3 text-emerald-400 hover:bg-white/10 hover:text-emerald-300 rounded-xl font-medium"
                        label="Baixar App"
                    />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed w-full bg-[#0A192F] border-b border-gray-800 z-[200] px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                    <img src="/logo-new.jpg" alt="QS Inclusão" className="h-8 w-auto object-contain bg-white/10 rounded p-1" />
                    <span className="text-lg font-bold text-white">Portal RH</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[150] bg-[#0A192F] pt-20 px-4 text-white overflow-y-auto">
                    <nav className="space-y-2 pb-20">
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                icon={item.icon}
                                label={item.label}
                                path={item.path}
                                active={location.pathname === item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        ))}

                        {isLibrasAvailable && (
                            <SidebarItem
                                icon={Video}
                                label="Central de Libras"
                                path="/rh/libras"
                                active={location.pathname === '/rh/libras'}
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}

                        <InstallButton
                            className="w-full px-4 py-3 text-emerald-400 hover:bg-white/10 hover:text-emerald-300 rounded-xl font-medium"
                            label="Baixar App"
                        />
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Sair</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
                <Outlet />
            </main>
        </div>
    );
};

export default RHLayout;
