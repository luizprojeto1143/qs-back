import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    AlertTriangle,
    Calendar,
    Video,
    FileText,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(path)}
            className={`
        w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${active
                    ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
            <span>{label}</span>
        </button>
    );
};

const DashboardLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Users, label: 'Colaboradores', path: '/dashboard/collaborators' },
        { icon: ClipboardList, label: 'Acompanhamentos', path: '/dashboard/visits' },
        { icon: AlertTriangle, label: 'Pendências', path: '/dashboard/pendencies' },
        { icon: Calendar, label: 'Agendamentos', path: '/dashboard/schedules' },
        { icon: Video, label: 'Feed Acessível', path: '/dashboard/feed' },
        { icon: FileText, label: 'Relatórios', path: '/dashboard/reports' },
        { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-[#0A192F] border-r border-gray-800 fixed h-full z-10 text-white">
                <div className="p-6 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">QS</span>
                    </div>
                    <span className="text-xl font-bold text-white">QS Inclusão</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed w-full bg-[#0A192F] border-b border-gray-800 z-20 px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">QS</span>
                    </div>
                    <span className="text-lg font-bold text-white">QS Inclusão</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-10 bg-[#0A192F] pt-20 px-4 text-white">
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                icon={item.icon}
                                label={item.label}
                                path={item.path}
                                active={location.pathname === item.path}
                            />
                        ))}
                        <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
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

export default DashboardLayout;
