import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface ReportItem {
    id: string;
    acceptedAt: string;
    userAgent: string;
    ipAddress: string;
    user: {
        name: string;
        email: string;
        role: string;
    };
    term: {
        version: string;
    };
}

const TermsOfUse = () => {
    const [content, setContent] = useState('');
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'edit' | 'report'>('edit');
    const [report, setReport] = useState<ReportItem[]>([]);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await api.get('/settings/terms');
                const data = response.data;
                setContent(data.content || '');
                setVersion(data.version || '1.0');
            } catch (error) {
                console.error('Error fetching terms', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    useEffect(() => {
        if (activeTab === 'report') {
            const fetchReport = async () => {
                try {
                    const response = await api.get('/settings/terms/report');
                    setReport(response.data);
                } catch (error) {
                    console.error('Error fetching report', error);
                    toast.error('Erro ao carregar relatório');
                }
            };
            fetchReport();
        }
    }, [activeTab]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const newVersion = (parseFloat(version) + 0.1).toFixed(1);

            await api.post('/settings/terms', { content, version: newVersion });

            setVersion(newVersion);
            toast.success('Termos de uso atualizados com sucesso!');
        } catch (error) {
            console.error('Error saving terms', error);
            const err = error as { message?: string };
            toast.error(err.message || 'Erro ao salvar termos.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-gray-500 dark:text-gray-400">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Termos de Uso</h1>
                    <p className="text-gray-500 dark:text-gray-400">Versão atual: {version}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'edit'
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Editar Termos
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'report'
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Relatório de Aceite
                    </button>
                </div>
            </div>

            {activeTab === 'edit' ? (
                <>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                        >
                            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>Salvar Alterações</span>
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conteúdo dos Termos</label>
                        <textarea
                            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm dark:bg-gray-700 dark:text-white"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Digite aqui os termos de uso..."
                        />
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Perfil</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Versão</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data/Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dispositivo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {report.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.user.name}</div>
                                            <div className="text-sm text-gray-500">{item.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.user.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.term.version}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(item.acceptedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.userAgent}>
                                            {item.userAgent}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.ipAddress}
                                        </td>
                                    </tr>
                                ))}
                                {report.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Nenhum aceite registrado ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TermsOfUse;
