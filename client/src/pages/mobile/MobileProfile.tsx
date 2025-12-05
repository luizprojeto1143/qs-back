import { useState, useEffect } from 'react';
import { User, Mail, Building, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.user) setUser(data.user);
            } catch (error) {
                console.error('Error fetching profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) return <div className="p-8 text-center">Carregando perfil...</div>;
    if (!user) return <div className="p-8 text-center">Erro ao carregar perfil.</div>;

    return (
        <div className="space-y-8">
            <div className="text-center pt-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="h-12 w-12 text-gray-400" />
                    )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-blue-600 font-medium">{user.role}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    <div className="p-4 flex items-center space-x-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        </div>
                    </div>

                    <div className="p-4 flex items-center space-x-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Building className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Empresa</p>
                            <p className="text-sm font-medium text-gray-900">{user.company?.name || 'Não vinculada'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-4 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sair da Conta</span>
            </button>
        </div>
    );
};

export default MobileProfile;
