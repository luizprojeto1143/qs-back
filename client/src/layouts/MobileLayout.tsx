import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, PlusCircle, User, Menu } from 'lucide-react';

const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Início', path: '/app' },
        { icon: Calendar, label: 'Agenda', path: '/app/schedule' },
        { icon: PlusCircle, label: 'Solicitar', path: '/app/request', primary: true },
        { icon: User, label: 'Perfil', path: '/app/profile' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Mobile Header */}
            <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="QS Inclusão" className="h-8 w-auto object-contain" />
                    <span className="font-bold text-gray-900">QS Inclusão</span>
                </div>
                <button className="p-2 text-gray-600">
                    <Menu className="h-6 w-6" />
                </button>
            </header>

            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-end z-20 pb-6">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
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
