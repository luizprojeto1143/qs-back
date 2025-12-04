import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const navigate = useNavigate();

    const menuItems = [
        { label: 'Cadastro de Empresa', path: '/dashboard/companies' },
        { label: 'Cadastro de Colaborador', path: '/dashboard/collaborators' },
        { label: 'Cadastro de Áreas', path: '/dashboard/areas' },
        { label: 'Cadastro de Setores', path: '/dashboard/sectors' },
        { label: 'Cadastro de Turnos', path: '/dashboard/shifts' },
        { label: 'Gestão de Disponibilidade de Horários', path: '/dashboard/availability' },
        { label: 'Termos de Uso', path: '/dashboard/terms' },
        { label: 'Configurar Categorias do Feed', path: '/dashboard/feed-categories' },
    ];

    const handleNavigate = (path: string) => {
        if (path === '/dashboard/collaborators') {
            navigate(path);
        } else {
            alert('Funcionalidade em desenvolvimento: ' + path);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>

            <div className="space-y-4">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => handleNavigate(item.path)}
                        className="w-full bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group text-left"
                    >
                        <span className="text-lg text-gray-700 font-medium group-hover:text-primary transition-colors">
                            {item.label}
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Settings;
