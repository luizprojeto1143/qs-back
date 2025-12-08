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
    Calendar
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: any) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => {
                navigate(path);
                if (onClick) onClick();
            }}
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

const RHLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    icon = { item.icon }
    label = { item.label }
    path = { item.path }
    active = { location.pathname === item.path }
    onClick = {() => setIsMobileMenuOpen(false)}
                        />
                    ))}
<button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
    <LogOut className="h-5 w-5" />
    <span>Sair</span>
</button>
                </nav >
            </div >
        )}

{/* Main Content */ }
<main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
    <Outlet />
</main>
        </div >
    );
};

export default RHLayout;
