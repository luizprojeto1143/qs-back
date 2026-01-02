import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    Settings, ToggleLeft, ToggleRight, Save, Shield,
    BarChart3, AlertTriangle, Brain, Users, Calendar, Eye
} from 'lucide-react';

interface SystemSettingsData {
    qsScoreEnabled: boolean;
    riskMapEnabled: boolean;
    aiAlertsEnabled: boolean;
    complaintsEnabled: boolean;
    mediationsEnabled: boolean;
    workScheduleEnabled: boolean;
    rhCanSeeQSScore: boolean;
    rhCanSeeRiskMap: boolean;
    rhCanSeeAlerts: boolean;
    openAIEnabled: boolean;
    autoAnalysisInterval: number;
}

const SettingsToggle: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label: string;
    description: string;
    icon: React.ReactNode;
    rightSection?: React.ReactNode;
}> = ({ enabled, onChange, label, description, icon, rightSection }) => (
    <div className={`p-4 rounded-xl border-2 transition-all ${enabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {icon}
                </div>
                <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {rightSection}
                <button
                    onClick={() => onChange(!enabled)}
                    className="focus:outline-none"
                >
                    {enabled ? (
                        <ToggleRight className="w-10 h-10 text-blue-600" />
                    ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                    )}
                </button>
            </div>
        </div>
    </div>
);

const SystemSettings: React.FC = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SystemSettingsData>({
        qsScoreEnabled: false,
        riskMapEnabled: false,
        aiAlertsEnabled: false,
        complaintsEnabled: false,
        mediationsEnabled: false,
        workScheduleEnabled: false,
        rhCanSeeQSScore: false,
        rhCanSeeRiskMap: false,
        rhCanSeeAlerts: false,
        openAIEnabled: false,
        autoAnalysisInterval: 7,
    });

    useEffect(() => {
        if (selectedCompanyId) {
            loadSettings();
        }
    }, [selectedCompanyId]);

    const loadSettings = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const res = await api.get(`/settings/${selectedCompanyId}`);
            setSettings(res.data);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCompanyId) return;
        setSaving(true);
        try {
            await api.put(`/settings/${selectedCompanyId}`, settings);
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof SystemSettingsData, value: boolean | number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl text-white">
                            <Settings className="w-6 h-6" />
                        </div>
                        Configurações do Sistema
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie quais funcionalidades estão ativas</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Módulos Principais */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Módulos Principais
                </h2>

                <SettingsToggle
                    enabled={settings.qsScoreEnabled}
                    onChange={(v) => updateSetting('qsScoreEnabled', v)}
                    label="QS Score de Inclusão"
                    description="Score 0-1000 que mede o nível de inclusão por área e empresa"
                    icon={<BarChart3 className={`w-5 h-5 ${settings.qsScoreEnabled ? 'text-blue-600' : 'text-gray-400'}`} />}
                />

                <SettingsToggle
                    enabled={settings.riskMapEnabled}
                    onChange={(v) => updateSetting('riskMapEnabled', v)}
                    label="Mapa de Risco"
                    description="Visualização de riscos por área com cores (verde/amarelo/vermelho)"
                    icon={<AlertTriangle className={`w-5 h-5 ${settings.riskMapEnabled ? 'text-blue-600' : 'text-gray-400'}`} />}
                />

                <SettingsToggle
                    enabled={settings.aiAlertsEnabled}
                    onChange={(v) => updateSetting('aiAlertsEnabled', v)}
                    label="Alertas Inteligentes"
                    description="Alertas gerados automaticamente pela IA"
                    icon={<Brain className={`w-5 h-5 ${settings.aiAlertsEnabled ? 'text-blue-600' : 'text-gray-400'}`} />}
                />

                <SettingsToggle
                    enabled={settings.complaintsEnabled}
                    onChange={(v) => updateSetting('complaintsEnabled', v)}
                    label="Canal de Denúncias"
                    description="Permite denúncias por texto, vídeo LIBRAS ou anônimo"
                    icon={<Users className={`w-5 h-5 ${settings.complaintsEnabled ? 'text-blue-600' : 'text-gray-400'}`} />}
                />

                <SettingsToggle
                    enabled={settings.workScheduleEnabled}
                    onChange={(v) => updateSetting('workScheduleEnabled', v)}
                    label="Escala de Trabalho"
                    description="Cadastro de escalas e cálculo automático de folgas"
                    icon={<Calendar className={`w-5 h-5 ${settings.workScheduleEnabled ? 'text-blue-600' : 'text-gray-400'}`} />}
                />
            </div>

            {/* Visibilidade para RH */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    Visibilidade para RH
                </h2>
                <p className="text-sm text-gray-500">
                    Controle o que o RH pode visualizar (somente após validação do Master)
                </p>

                <SettingsToggle
                    enabled={settings.rhCanSeeQSScore}
                    onChange={(v) => updateSetting('rhCanSeeQSScore', v)}
                    label="RH pode ver QS Score"
                    description="Permite que o RH visualize os scores de inclusão"
                    icon={<BarChart3 className={`w-5 h-5 ${settings.rhCanSeeQSScore ? 'text-purple-600' : 'text-gray-400'}`} />}
                />

                <SettingsToggle
                    enabled={settings.rhCanSeeRiskMap}
                    onChange={(v) => updateSetting('rhCanSeeRiskMap', v)}
                    label="RH pode ver Mapa de Risco"
                    description="Permite que o RH visualize o mapa de riscos"
                    icon={<AlertTriangle className={`w-5 h-5 ${settings.rhCanSeeRiskMap ? 'text-purple-600' : 'text-gray-400'}`} />}
                />

                <SettingsToggle
                    enabled={settings.rhCanSeeAlerts}
                    onChange={(v) => updateSetting('rhCanSeeAlerts', v)}
                    label="RH pode ver Alertas"
                    description="Permite que o RH visualize alertas validados"
                    icon={<Brain className={`w-5 h-5 ${settings.rhCanSeeAlerts ? 'text-purple-600' : 'text-gray-400'}`} />}
                />
            </div>

            {/* Configurações de IA */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-green-600" />
                    Configurações de IA
                </h2>

                <SettingsToggle
                    enabled={settings.openAIEnabled}
                    onChange={(v) => updateSetting('openAIEnabled', v)}
                    label="Habilitar OpenAI"
                    description="Ativa análises automáticas usando inteligência artificial"
                    icon={<Brain className={`w-5 h-5 ${settings.openAIEnabled ? 'text-green-600' : 'text-gray-400'}`} />}
                    rightSection={
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Intervalo:</span>
                            <select
                                value={settings.autoAnalysisInterval}
                                onChange={(e) => updateSetting('autoAnalysisInterval', parseInt(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value={1}>Diário</option>
                                <option value={7}>Semanal</option>
                                <option value={14}>Quinzenal</option>
                                <option value={30}>Mensal</option>
                            </select>
                        </div>
                    }
                />
            </div>

            {/* Aviso */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-800">Importante</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Alterações nas configurações afetam imediatamente o que cada perfil pode visualizar.
                            Certifique-se de que a chave da OpenAI está configurada no servidor para usar a IA.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
