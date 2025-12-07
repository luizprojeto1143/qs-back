import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { api } from '../../lib/api';

const TermsOfUse = () => {
    const [content, setContent] = useState('');
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    const handleSave = async () => {
        setSaving(true);
        try {
            const newVersion = (parseFloat(version) + 0.1).toFixed(1);

            await api.post('/settings/terms', { content, version: newVersion });

            setVersion(newVersion);
            alert('Termos de uso atualizados com sucesso!');
        } catch (error) {
            console.error('Error saving terms', error);
            alert('Erro ao salvar termos.');
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
        </div>
    );
};

export default TermsOfUse;
