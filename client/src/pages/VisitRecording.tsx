import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

import { useCompany } from '../contexts/CompanyContext';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { VisitFormData, IndividualNote } from '../types/visit';

import { VisitReportsTab } from '../components/visits/VisitReportsTab';
import { VisitEvaluationsTab } from '../components/visits/VisitEvaluationsTab';
import { VisitPendenciesTab } from '../components/visits/VisitPendenciesTab';
import { VisitAttachmentsTab } from '../components/visits/VisitAttachmentsTab';

const VisitRecording = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { selectedCompanyId, companies: contextCompanies } = useCompany();
    const [activeTab, setActiveTab] = useState(0);

    // Data State
    const [companies, setCompanies] = useState<any[]>(contextCompanies);
    const [areas, setAreas] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [linkedScheduleIds, setLinkedScheduleIds] = useState<string[]>([]);
    const [individualNotes, setIndividualNotes] = useState<IndividualNote[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<VisitFormData>({
        companyId: selectedCompanyId || '',
        areaId: '',
        collaboratorIds: [],
        relatos: {
            lideranca: '',
            colaborador: '',
            consultoria: '',
            observacoes: '',
            audioLideranca: null,
            audioColaborador: null
        },
        avaliacoes: {
            area: {},
            lideranca: {},
            colaborador: {}
        },
        pendencias: [],
        anexos: []
    });

    // Block RH access completely
    useEffect(() => {
        if (user && user.role === 'RH') {
            toast.error('Acesso não autorizado. Apenas consultoria pode registrar acompanhamentos.');
            navigate('/rh/visits', { replace: true });
        }
    }, [user, navigate]);

    // Update formData when selectedCompanyId changes
    useEffect(() => {
        if (selectedCompanyId) {
            setFormData(prev => ({ ...prev, companyId: selectedCompanyId }));

            const fetchData = async () => {
                try {
                    if (contextCompanies.length > 0) {
                        setCompanies(contextCompanies);
                    } else {
                        const resStructure = await api.get('/structure');
                        const structure = resStructure.data;
                        if (structure.company) setCompanies([structure.company]);
                    }

                    const [resAreas, resCollabs] = await Promise.all([
                        api.get('/areas'),
                        api.get('/collaborators')
                    ]);

                    setAreas(resAreas.data);
                    setCollaborators(resCollabs.data.data || resCollabs.data);

                    if (location.state && location.state.scheduleId) {
                        const { scheduleId, companyId, areaName, date } = location.state;

                        if (companyId) setFormData(prev => ({ ...prev, companyId }));

                        if (areaName) {
                            const area = resAreas.data.find((a: any) => a.name === areaName);
                            if (area) {
                                setFormData(prev => ({ ...prev, areaId: area.id }));

                                const resSchedules = await api.get('/schedules');
                                const allSchedules = resSchedules.data;
                                const targetDate = new Date(date).toISOString().split('T')[0];

                                const relatedSchedules = allSchedules.filter((s: any) => {
                                    const sDate = new Date(s.date).toISOString().split('T')[0];
                                    return s.status === 'PENDENTE' &&
                                        sDate === targetDate &&
                                        s.area === areaName &&
                                        (!companyId || s.companyId === companyId);
                                });

                                const ids = relatedSchedules.map((s: any) => s.id);
                                if (!ids.includes(scheduleId)) ids.push(scheduleId);
                                setLinkedScheduleIds(ids);

                                const collaboratorsToAdd: string[] = [];
                                relatedSchedules.forEach((s: any) => {
                                    const collab = resCollabs.data.data ? resCollabs.data.data.find((c: any) => c.name === s.collaborator) : resCollabs.data.find((c: any) => c.name === s.collaborator);
                                    if (collab && !collaboratorsToAdd.includes(collab.id)) {
                                        collaboratorsToAdd.push(collab.id);
                                    }
                                });

                                if (location.state.collaboratorName) {
                                    const initialCollab = resCollabs.data.data ? resCollabs.data.data.find((c: any) => c.name === location.state.collaboratorName) : resCollabs.data.find((c: any) => c.name === location.state.collaboratorName);
                                    if (initialCollab && !collaboratorsToAdd.includes(initialCollab.id)) {
                                        collaboratorsToAdd.push(initialCollab.id);
                                    }
                                }

                                setFormData(prev => ({ ...prev, areaId: area.id, collaboratorIds: collaboratorsToAdd }));

                                if (ids.length > 1) {
                                    toast.info(`Encontrados ${ids.length} agendamentos para esta área hoje. Todos foram agrupados!`);
                                }
                            }
                        }
                    }

                    if (location.state && location.state.visitId) {
                        const { visitId } = location.state;
                        try {
                            const resVisit = await api.get(`/visits/${visitId}`);
                            const visit = resVisit.data;

                            setFormData({
                                companyId: visit.companyId,
                                areaId: visit.areaId || '',
                                collaboratorIds: visit.collaborators.map((c: any) => c.id),
                                relatos: {
                                    lideranca: visit.relatoLideranca || '',
                                    colaborador: visit.relatoColaborador || '',
                                    consultoria: visit.relatoConsultoria || '',
                                    observacoes: visit.observacoesMaster || '',
                                    audioLideranca: visit.audioLiderancaUrl || null,
                                    audioColaborador: visit.audioColaboradorUrl || null
                                },
                                avaliacoes: {
                                    area: typeof visit.avaliacaoArea === 'string' ? JSON.parse(visit.avaliacaoArea) : visit.avaliacaoArea || {},
                                    lideranca: typeof visit.avaliacaoLideranca === 'string' ? JSON.parse(visit.avaliacaoLideranca) : visit.avaliacaoLideranca || {},
                                    colaborador: typeof visit.avaliacaoColaborador === 'string' ? JSON.parse(visit.avaliacaoColaborador) : visit.avaliacaoColaborador || {}
                                },
                                pendencias: visit.generatedPendencies || [],
                                anexos: visit.attachments || []
                            });

                            if (visit.notes) {
                                setIndividualNotes(visit.notes.map((n: any) => ({
                                    id: n.id,
                                    collaboratorId: n.collaboratorId,
                                    content: n.content
                                })));
                            }
                        } catch (err) {
                            console.error("Error fetching visit for edit", err);
                            toast.error("Erro ao carregar dados da visita");
                        }
                    }
                } catch (error) {
                    console.error('Error fetching data', error);
                }
            };
            fetchData();
        }
    }, [selectedCompanyId, contextCompanies, location.state]);

    // NEW: Pull Logic - Watch for Area changes
    useEffect(() => {
        const fetchApprovedSchedules = async () => {
            if (!formData.areaId || !formData.companyId) return;

            try {
                const selectedArea = areas.find(a => a.id === formData.areaId);
                const areaName = selectedArea?.name;

                if (!areaName) return;

                const today = new Date().toISOString().split('T')[0];
                const res = await api.get(`/schedules?date=${today}&area=${areaName}&status=APROVADO`);

                if (res.data && res.data.length > 0) {
                    const approvedSchedules = res.data;
                    const ids = approvedSchedules.map((s: any) => s.id);
                    setLinkedScheduleIds(prev => [...new Set([...prev, ...ids])]);

                    const collaboratorsToAdd: string[] = [];
                    approvedSchedules.forEach((s: any) => {
                        const collab = collaborators.find((c: any) => c.name === s.collaborator);
                        if (collab) collaboratorsToAdd.push(collab.id);
                    });

                    setFormData(prev => {
                        let newReport = prev.relatos.colaborador;
                        const reasonsToAdd = approvedSchedules
                            .map((s: any) => `${s.collaborator}: ${s.reason || 'Sem motivo'}`)
                            .join('\n');

                        if (reasonsToAdd && !newReport.includes(reasonsToAdd)) {
                            newReport = newReport ? `${newReport}\n\n${reasonsToAdd}` : reasonsToAdd;
                        }

                        return {
                            ...prev,
                            collaboratorIds: [...new Set([...prev.collaboratorIds, ...collaboratorsToAdd])],
                            relatos: {
                                ...prev.relatos,
                                colaborador: newReport
                            }
                        };
                    });
                }
            } catch (error) {
                console.error('Error fetching approved schedules', error);
            }
        };

        fetchApprovedSchedules();
    }, [formData.areaId, formData.companyId, areas, collaborators]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                areaId: formData.areaId || null,
                individualNotes
            };

            let response;
            if (location.state?.visitId) {
                response = await api.put(`/visits/${location.state.visitId}`, payload);
            } else {
                response = await api.post('/visits', payload);
            }

            if (response.status === 200 || response.status === 201) {
                if (linkedScheduleIds.length > 0) {
                    await Promise.all(linkedScheduleIds.map(id =>
                        api.put(`/schedules/${id}`, { status: 'REALIZADO' })
                    ));
                }

                toast.success('Acompanhamento salvo com sucesso!');
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                const basePath = user.role === 'RH' ? '/rh/visits' : '/dashboard';
                navigate(basePath);
            } else {
                toast.error('Erro ao salvar acompanhamento');
            }
        } catch (error) {
            console.error('Error saving visit', error);
            toast.error('Erro ao conectar com o servidor');
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
                        className={`input-field max-w-xs ${selectedCompanyId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={formData.companyId}
                        onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                        disabled={!!selectedCompanyId}
                    >
                        <option value="">Selecione a Empresa</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100">
                    <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab, index) => (
                            <button
                                type="button"
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

                <div className="p-6">
                    {activeTab === 0 && (
                        <VisitReportsTab
                            formData={formData}
                            setFormData={setFormData}
                            areas={areas}
                            collaborators={collaborators}
                            individualNotes={individualNotes}
                            setIndividualNotes={setIndividualNotes}
                        />
                    )}
                    {activeTab === 1 && <VisitEvaluationsTab formData={formData} setFormData={setFormData} />}
                    {activeTab === 2 && <VisitPendenciesTab formData={formData} setFormData={setFormData} />}
                    {activeTab === 3 && <VisitAttachmentsTab formData={formData} setFormData={setFormData} />}
                </div>

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
