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
    X,
    Moon,
    Sun,
    Shield,
    Target,
    GraduationCap,
    BarChart3,
    Brain,
    MessageSquare,
    CalendarDays,
    Cog,
    Scale,
    PieChart
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Bell } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

// ... (imports)

interface SidebarItemProps {
    icon: any;
    label: string;
    path: string;
    active: boolean;
    onClick?: () => void;
    className?: string;
}

const SidebarItem = ({ icon: Icon, label, path, active, onClick, className }: SidebarItemProps) => {
    const navigate = useNavigate();
    return (
        <button
            type="button"
            onClick={() => {
                navigate(path);
                if (onClick) onClick();
            }}
            className={`
        w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${active
                    ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${className || ''}`}
        >
            <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
            <span>{label}</span>
        </button>
    );
};

const DashboardLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Notification State
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showNotifications, setShowNotifications] = React.useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Libras Call Notification (Master/RH)
    React.useEffect(() => {
        const userStr = localStorage.getItem('user');
        let isMaster = false;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'MASTER' || user.role === 'RH') isMaster = true;
            } catch (e) { }
        }

        if (!isMaster) return;

        const checkCalls = async () => {
            try {
                const response = await api.get('/libras/calls/pending');
                const calls = response.data.calls;
                if (calls.length > 0 && location.pathname !== '/dashboard/libras') {
                    toast.info(`Há ${calls.length} solicitação(ões) de intérprete pendente(s)!`, {
                        action: {
                            label: 'Atender',
                            onClick: () => navigate('/dashboard/libras')
                        },
                        duration: 5000,
                        id: 'libras-notification' // Prevent duplicate toasts
                    });
                }
            } catch (error) {
                console.error('Error checking pending calls', error);
            }
        };

        const interval = setInterval(checkCalls, 10000); // Check every 10s
        checkCalls(); // Initial check

        return () => clearInterval(interval);
    }, [location.pathname, navigate]);

    const handleMarkAsRead = async (id: string, link?: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (link) {
                navigate(link);
                setShowNotifications(false);
            }
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
        { icon: Users, label: 'Colaboradores', path: '/dashboard/collaborators' },
        { icon: ClipboardList, label: 'Acompanhamentos', path: '/dashboard/visits' },
        { icon: AlertTriangle, label: 'Pendências', path: '/dashboard/pendencies' },
        { icon: Calendar, label: 'Agendamentos', path: '/dashboard/schedules' },
        { icon: Video, label: 'Feed Acessível', path: '/dashboard/feed' },
        { icon: GraduationCap, label: 'Universidade', path: '/dashboard/university' },
        { icon: Target, label: 'PDI', path: '/dashboard/pdi' },
        { icon: FileText, label: 'Relatórios', path: '/dashboard/reports' },
    ];

    const qsScoreItems = [
        { icon: BarChart3, label: 'QS Score', path: '/dashboard/qs-score' },
        { icon: Brain, label: 'IA Analítica', path: '/dashboard/ai-insights' },
        { icon: MessageSquare, label: 'Denúncias', path: '/dashboard/complaints' },
        { icon: Scale, label: 'Mediação', path: '/dashboard/mediations' },
        { icon: PieChart, label: 'Censo & Indicadores', path: '/dashboard/indicators' },
        { icon: CalendarDays, label: 'Escalas', path: '/dashboard/work-schedules' },
        { icon: Cog, label: 'Config. Módulos', path: '/dashboard/system-settings' },
    ];

    const settingsItems = [
        { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
        { icon: Shield, label: 'Acessos', path: '/dashboard/users' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-[#0A192F] border-r border-gray-800 fixed h-full z-10 text-white">
                <div className="p-6 flex items-center justify-center">
                    <img src="/logo.png" alt="QS Inclusão" className="h-12 w-auto object-contain" />
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

                    <SidebarItem
                        icon={Video}
                        label="Central de Libras"
                        path="/dashboard/libras"
                        active={location.pathname === '/dashboard/libras'}
                    />

                    {/* QS Score v2.0 */}
                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            QS Score v2.0
                        </p>
                        {qsScoreItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                icon={item.icon}
                                label={item.label}
                                path={item.path}
                                active={location.pathname === item.path}
                            />
                        ))}
                    </div>

                    {/* Configurações */}
                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Sistema
                        </p>
                        {settingsItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                icon={item.icon}
                                label={item.label}
                                path={item.path}
                                active={location.pathname === item.path}
                            />
                        ))}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors mt-4"
                    >
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed w-full bg-[#0A192F] border-b border-gray-800 z-[200] px-4 py-3 flex items-center justify-between text-white h-16">
                <div className="flex items-center space-x-3">
                    <img src="/logo.png" alt="QS Inclusão" className="h-8 w-auto object-contain bg-white/10 rounded p-1" />
                    <span className="text-lg font-bold text-white">QS Inclusão</span>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Notification Bell Mobile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#0A192F]"></span>
                            )}
                        </button>
                    </div>

                    <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </button>
                    <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            {/* ... (unchanged) ... */}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[150] bg-[#0A192F] pt-20 px-4 text-white">
                    <nav className="space-y-2">
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

                        <SidebarItem
                            icon={Video}
                            label="Central de Libras"
                            path="/dashboard/libras"
                            active={location.pathname === '/dashboard/libras'}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <button
                            type="button"
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
            <main className="flex-1 md:ml-64 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col transition-colors pt-16 md:pt-0">
                {/* Desktop Header */}
                <header className="hidden md:flex justify-end items-center px-8 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-[110] transition-colors">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors relative"
                        >
                            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-700"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={async () => {
                                                await api.put('/notifications/read-all', {});
                                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                                setUnreadCount(0);
                                            }}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                        >
                                            Marcar todas como lidas
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            Nenhuma notificação.
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                            >
                                                <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(notification.createdAt))}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
