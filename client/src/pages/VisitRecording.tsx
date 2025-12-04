import { useState, useEffect } from 'react';
import { Mic, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VisitRecording = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        companyId: '',
        areaId: '',
        collaboratorIds: [] as string[],
        relatos: {
            lideranca: '',
            colaborador: '',
            observacoes: ''
        },
        avaliacoes: {
            area: {},
            lideranca: {},
            colaborador: {}
        },
        pendencias: [] as any[],
        anexos: [] as any[]
    });

    // Mock Data for Selects (Replace with API calls later)
    const [companies, setCompanies] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Companies
                // Note: In a real multi-tenant app, the user might only see their own company.
                // For Master, we might want to list all. For now, we'll assume the user's company or a list if Master.
                // Since we don't have a specific 'list companies' endpoint for dropdowns yet that is public, 
                // we will use the structure endpoint or similar.
                // For simplicity in this iteration, we will fetch the user's structure.

                const resStructure = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/structure`, { headers });
                const structure = await resStructure.json();

                if (structure.company) {
                    setCompanies([structure.company]);
                    // If the company has sectors and areas, we can populate areas
                    const allAreas: any[] = [];
                    structure.company.sectors.forEach((s: any) => {
                        if (s.areas) allAreas.push(...s.areas);
                    });
                    setAreas(allAreas);
                }

                // Fetch Collaborators
                const resCollaborators = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collaborators`, { headers });
                const collaboratorsData = await resCollaborators.json();
                setCollaborators(collaboratorsData);

            } catch (error) {
                console.error('Error fetching data', error);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/visits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Acompanhamento salvo com sucesso!');
                navigate('/dashboard');
            } else {
                alert('Erro ao salvar acompanhamento');
            }
        } catch (error) {
            console.error('Error saving visit', error);
            alert('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { name: 'Relatos', id: 'relatos' },
        { name: 'Avaliações', id: 'avaliacoes' },
        { name: 'Pendências', id: 'pendencias' },
        { name: 'Anexos', id: 'anexos' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Registrar Acompanhamento</h1>
                <div className="flex space-x-3">
                    <select
                        className="input-field max-w-xs"
                        value={formData.companyId}
                        onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                    >
                        <option value="">Selecione a Empresa</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs Header */}
                <div className="border-b border-gray-100">
                    <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(index)}
                                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${activeTab === index
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Tab 1: Relatos */}
                    {activeTab === 0 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Área</label>
                                    <select
                                        className="input-field"
                                        value={formData.areaId}
                                        onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Colaboradores</label>
                                    <select
                                        className="input-field"
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val && !formData.collaboratorIds.includes(val)) {
                                                setFormData({ ...formData, collaboratorIds: [...formData.collaboratorIds, val] })
                                            }
                                        }}
                                    >
                                        <option value="">Adicionar...</option>
                                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.collaboratorIds.map(id => {
                                            const collab = collaborators.find(c => c.id === id);
                                            return (
                                                <span key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {collab?.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, collaboratorIds: formData.collaboratorIds.filter(cid => cid !== id) })}
                                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-900">Relato da Liderança</label>
                                <div className="relative">
                                    <textarea
                                        rows={4}
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-4"
                                        placeholder="Digite o relato..."
                                        value={formData.relatos.lideranca}
                                        onChange={e => setFormData({ ...formData, relatos: { ...formData.relatos, lideranca: e.target.value } })}
                                    />
                                    <button className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors">
                                        <Mic className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-900">Relato do Colaborador</label>
                                <div className="relative">
                                    <textarea
                                        rows={4}
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-4"
                                        placeholder="Digite o relato..."
                                        value={formData.relatos.colaborador}
                                        onChange={e => setFormData({ ...formData, relatos: { ...formData.relatos, colaborador: e.target.value } })}
                                    />
                                    <button className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors">
                                        <Mic className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-900">Observações</label>
                                <textarea
                                    rows={3}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-4"
                                    placeholder="Observações técnicas..."
                                    value={formData.relatos.observacoes}
                                    onChange={e => setFormData({ ...formData, relatos: { ...formData.relatos, observacoes: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Avaliações */}
                    {activeTab === 1 && (
                        <div className="space-y-8">
                            {['Avaliação da Área', 'Avaliação da Liderança', 'Avaliação do Colaborador'].map((section) => (
                                <div key={section} className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900">{section}</h3>
                                    <div className="grid gap-4">
                                        {['Comunicação', 'Acolhimento', 'Acessibilidade', 'Relacionamento', 'Postura'].map((item) => (
                                            <div key={item} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                                <span className="text-sm font-medium text-gray-700">{item}</span>
                                                <div className="flex space-x-2">
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <button
                                                            key={rating}
                                                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all text-sm font-medium text-gray-600 bg-white"
                                                        >
                                                            {rating}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 3: Pendências */}
                    {activeTab === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button className="btn-primary flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Nova Pendência</span>
                                </button>
                            </div>

                            <div className="text-center py-10 text-gray-500">
                                <p>Nenhuma pendência registrada para este acompanhamento.</p>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Anexos */}
                    {activeTab === 3 && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50">
                                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                <p className="mt-2 text-sm font-medium text-gray-900">Clique para enviar arquivo</p>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF, MP4 até 10MB</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary w-full md:w-auto flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <span>Salvando...</span>
                        ) : (
                            <>
                                <CheckCircle className="h-5 w-5" />
                                <span>Salvar Acompanhamento</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisitRecording;
