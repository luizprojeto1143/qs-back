
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import { Target, Trophy, Users } from 'lucide-react';
import PDITab from './PDITab';
import PerformanceTab from './PerformanceTab';
import ResultsTab from './ResultsTab';

import { useAuth } from '../../contexts/AuthContext';

const TalentManagement = () => {
    const { company } = useCompany();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'pdi' | 'performance' | 'results'>('pdi');
    const navigate = useNavigate();

    useEffect(() => {
        // If not enabled AND not master, redirect
        /*
        if (company && !company.talentManagementEnabled && user?.role !== 'MASTER') {
            navigate('/dashboard');
        }
        */
    }, [company, user, navigate]);

    // if (!company?.talentManagementEnabled && user?.role !== 'MASTER') return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Talentos</h1>
                    <p className="text-gray-500">Desenvolvimento, Avaliação e Feedback</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('pdi')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pdi'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Target className="h-4 w-4" />
                    PDI
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'performance'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Trophy className="h-4 w-4" />
                    Avaliação de Desempenho
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'results'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Meus Resultados
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeTab === 'pdi' && <PDITab />}
                {activeTab === 'performance' && <PerformanceTab />}
                {activeTab === 'results' && <ResultsTab />}
            </div>
        </div>
    );
};

export default TalentManagement;
