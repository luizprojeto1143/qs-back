import { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar } from 'lucide-react';
import { api } from '../../lib/api';

const MobileTeam = () => {
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                // Now /users returns company users for LIDER/RH
                const response = await api.get('/users?limit=50');
                const allUsers = response.data.data;

                // Filter only COLLABORATORS (and optionally by Leader's area if logic existed)
                const teamMembers = allUsers.filter((u: any) => u.role === 'COLABORADOR');
                setTeam(teamMembers);

            } catch (error) {
                console.error('Error fetching team', error);
                // Keep empty or show error
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando equipe...</div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-right pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Minha Equipe</h1>
                <p className="text-gray-500">{team.length} colaboradores sob sua gestão</p>
            </div>

            <div className="space-y-4">
                {team.map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.role}</p>
                            {member.status === 'Férias' && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                    Em Férias
                                </span>
                            )}
                        </div>
                        <button className="p-3 text-blue-600 bg-blue-50 rounded-full active:scale-95 transition-transform">
                            <Phone className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileTeam;
