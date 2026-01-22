
import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Printer, Target, CheckCircle, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../lib/api';
import { useCompany } from '../../contexts/CompanyContext';

interface PDI {
    id: string;
    userId: string;
    user: {
        name: string;
        collaboratorProfile?: {
            area?: {
                name: string;
            };
        };
    };
    objective: string;
    skills: string;
    actions: string;
    accessibilityNeeds?: string;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
    createdAt: string;
}

const PDITab = () => {
    const { selectedCompanyId } = useCompany();
    const [pdis, setPdis] = useState<PDI[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        objective: '',
        skills: '',
        actions: '',
        accessibilityNeeds: ''
    });

    // Collaborators for selection
    const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; collaboratorProfile?: { area?: { name: string } } }>>([]);

    const printRef = useRef<HTMLDivElement>(null);
    const [selectedPDI, setSelectedPDI] = useState<PDI | null>(null);



    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'PDI - Plano de Desenvolvimento Individual',
        onBeforeGetContent: async () => {
            // Wait for state update just in case
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } as unknown as { content: () => HTMLDivElement | null }); // Using better casting

    useEffect(() => {
        fetchPDIs();
        fetchCollaborators();
    }, [selectedCompanyId]);

    const fetchPDIs = async () => {
        try {
            const response = await api.get('/pdis');
            setPdis(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching PDIs', error);
        }
    };

    const fetchCollaborators = async () => {
        try {
            const response = await api.get('/collaborators');
            setCollaborators(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching collaborators', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/pdis', formData);
            toast.success('PDI criado com sucesso!');
            setIsModalOpen(false);
            setFormData({ userId: '', objective: '', skills: '', actions: '', accessibilityNeeds: '' });
            fetchPDIs();
        } catch (error) {
            toast.error('Erro ao criar PDI');
        }
    };

    const filteredPDIs = pdis.filter(pdi =>
        pdi.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openPrintModal = (pdi: PDI) => {
        setSelectedPDI(pdi);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar por colaborador..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Novo PDI</span>
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPDIs.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl text-gray-500">
                        Nenhum PDI encontrado. Crie um novo para começar.
                    </div>
                ) : (
                    filteredPDIs.map((pdi) => (
                        <div key={pdi.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {pdi.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{pdi.user.name}</h3>
                                        <p className="text-xs text-gray-500">{pdi.user.collaboratorProfile?.area?.name || 'Área não informada'}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${pdi.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    pdi.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {pdi.status === 'ACTIVE' ? 'Ativo' : pdi.status === 'COMPLETED' ? 'Concluído' : 'Rascunho'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1 mb-1">
                                        <Calendar className="h-3 w-3" /> Criado em
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        {new Date(pdi.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1 mb-1">
                                        <Target className="h-3 w-3" /> Objetivo
                                    </p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{pdi.objective}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => openPrintModal(pdi)}
                                    className="text-gray-500 hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors"
                                >
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    )))}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Novo PDI</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                                <select
                                    required
                                    className="input-field"
                                    value={formData.userId}
                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {collaborators.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Qual é o meu principal objetivo de desenvolvimento para os próximos meses?
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    className="input-field"
                                    placeholder="Ex: Melhorar minha comunicação com a equipe..."
                                    value={formData.objective}
                                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Quais habilidades ou competências preciso melhorar para atingir esse objetivo?
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    className="input-field"
                                    placeholder="Ex: Oratória, Escuta ativa..."
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Quais ações práticas vou realizar para desenvolver essas habilidades?
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    className="input-field"
                                    placeholder="Ex: Fazer um curso de oratória, pedir feedback semanal..."
                                    value={formData.actions}
                                    onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Adaptações ou Tecnologia Assistiva Necessária?
                                </label>
                                <textarea
                                    rows={2}
                                    className="input-field bg-white"
                                    placeholder="Ex: Leitor de tela, monitor maior, intérprete em reuniões..."
                                    value={formData.accessibilityNeeds}
                                    onChange={(e) => setFormData({ ...formData, accessibilityNeeds: e.target.value })}
                                />
                                <p className="text-xs text-blue-700 mt-1">
                                    *Específico para garantir a acessibilidade do processo de desenvolvimento.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Salvar PDI
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden Print Template */}
            <div className="hidden print:block">
                <div ref={printRef} className="p-10 bg-white text-gray-900">
                    {selectedPDI && (
                        <div className="max-w-3xl mx-auto space-y-8">
                            <div className="text-center border-b pb-6">
                                <h1 className="text-3xl font-bold text-primary mb-2">Plano de Desenvolvimento Individual</h1>
                                <p className="text-gray-500">PDI - {new Date(selectedPDI.createdAt).toLocaleDateString('pt-BR')}</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-bold">Colaborador</p>
                                        <p className="text-xl font-medium">{selectedPDI.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-bold">Área</p>
                                        <p className="text-xl font-medium">{selectedPDI.user.collaboratorProfile?.area?.name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="border-l-4 border-blue-500 pl-4 py-2">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Objetivo Principal</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedPDI.objective}</p>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4 py-2">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Habilidades a Desenvolver</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedPDI.skills}</p>
                                </div>

                                <div className="border-l-4 border-purple-500 pl-4 py-2">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Plano de Ação</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedPDI.actions}</p>
                                </div>


                                {selectedPDI.accessibilityNeeds && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Necessidades de Acessibilidade</h3>
                                        <p className="text-gray-900">{selectedPDI.accessibilityNeeds}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-12 mt-12 border-t border-gray-200 grid grid-cols-2 gap-20">
                                <div className="text-center">
                                    <div className="border-b border-gray-400 mb-2 h-8"></div>
                                    <p className="text-sm font-medium">{selectedPDI.user.name}</p>
                                    <p className="text-xs text-gray-500">Colaborador</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-gray-400 mb-2 h-8"></div>
                                    <p className="text-sm font-medium">Liderança / RH</p>
                                    <p className="text-xs text-gray-500">Responsável</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default PDITab;
