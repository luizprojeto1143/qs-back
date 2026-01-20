import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCompany } from '../contexts/CompanyContext';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { visitSchema, type VisitFormData } from '../schemas/visitSchema';

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
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); // Flag to prevent re-fetching

    // Form Setup
    const methods = useForm<VisitFormData>({
        resolver: zodResolver(visitSchema),
        defaultValues: {
            companyId: selectedCompanyId || '',
            areaId: '',
            collaboratorIds: [],
            date: new Date().toISOString(), // ADD THIS - Required by schema!
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
            anexos: [],
            notes: []
        },
        mode: 'onChange' // Real-time validation
    });

    const { handleSubmit, reset, watch, setValue, formState: { errors, isValid } } = methods;
    const watchedCompanyId = watch('companyId');
    const watchedAreaId = watch('areaId');

    // Block RH access
    useEffect(() => {
        if (user && user.role === 'RH') {
            toast.error('Acesso não autorizado. Apenas consultoria pode registrar acompanhamentos.');
            navigate('/rh/visits', { replace: true });
        }
    }, [user, navigate]);

    // Fetch Initial Data
    useEffect(() => {
        // Skip re-fetch if already loaded (prevents overwriting user edits)
        if (dataLoaded) return;

        if (selectedCompanyId) {
            setValue('companyId', selectedCompanyId);
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Determine company to fetch for
                const targetCompanyId = selectedCompanyId || watchedCompanyId || '';

                const promises: Record<string, Promise<any>> = {
                    areas: api.get('/areas'),
                    collaborators: api.get('/collaborators'),
                };

                if (contextCompanies.length === 0) {
                    promises.structure = api.get('/structure');
                }

                if (location.state?.scheduleId) {
                    promises.schedules = api.get('/schedules');
                }

                if (location.state?.visitId) {
                    promises.visit = api.get(`/visits/${location.state.visitId}`);
                }

                const results = await Promise.all(Object.values(promises));
                const keys = Object.keys(promises);
                const data: Record<string, any> = {};

                keys.forEach((key, index) => {
                    data[key] = results[index]?.data;
                });

                // Updates
                if (data.structure?.company) setCompanies([data.structure.company]);
                else if (contextCompanies.length > 0) setCompanies(contextCompanies);

                if (data.areas) setAreas(data.areas);
                if (data.collaborators) setCollaborators(data.collaborators.data || data.collaborators);

                // Handle Schedule Linking
                if (location.state?.scheduleId && data.schedules && targetCompanyId) {
                    const { scheduleId, areaName, date } = location.state;

                    if (areaName && data.areas) {
                        const area = data.areas.find((a: any) => a.name === areaName);
                        if (area) {
                            setValue('areaId', area.id);

                            // Find other schedules
                            const targetDate = new Date(date).toISOString().split('T')[0];
                            const relatedSchedules = data.schedules.filter((s: any) => {
                                const sDate = new Date(s.date).toISOString().split('T')[0];
                                return s.status === 'PENDENTE' &&
                                    sDate === targetDate &&
                                    s.area === areaName &&
                                    s.companyId === targetCompanyId;
                            });

                            const ids = relatedSchedules.map((s: any) => s.id);
                            if (!ids.includes(scheduleId)) ids.push(scheduleId);
                            setLinkedScheduleIds(ids);

                            // Auto-select collaborators
                            const collabsList = data.collaborators.data || data.collaborators;
                            const collaboratorsToAdd: string[] = [];

                            relatedSchedules.forEach((s: any) => {
                                const collab = collabsList.find((c: any) => c.name === s.collaborator);
                                if (collab) collaboratorsToAdd.push(collab.id);
                            });

                            if (location.state.collaboratorName) {
                                const initialCollab = collabsList.find((c: any) => c.name === location.state.collaboratorName);
                                if (initialCollab) collaboratorsToAdd.push(initialCollab.id);
                            }

                            setValue('collaboratorIds', [...new Set(collaboratorsToAdd)]);

                            if (ids.length > 1) {
                                toast.info(`Encontrados ${ids.length} agendamentos para esta área hoje.`);
                            }
                        }
                    }
                }

                // Handle Edit Mode
                if (data.visit) {
                    const visit = data.visit;
                    reset({
                        companyId: visit.companyId,
                        areaId: visit.areaId || '',
                        collaboratorIds: visit.collaborators.map((c: any) => c.id),
                        date: visit.date, // Preserve original date
                        masterId: visit.masterId,
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
                        anexos: visit.attachments || [],
                        notes: visit.notes?.map((n: any) => ({
                            collaboratorId: n.collaboratorId,
                            content: n.content
                        })) || []
                    });
                }

                // Mark as loaded to prevent re-fetching
                setDataLoaded(true);

            } catch (error) {
                console.error('Error fetching data', error);
                toast.error('Erro ao carregar dados iniciais');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.visitId]); // Only re-run on visitId change (for navigation between edits)

    // Pull Logic
    useEffect(() => {
        const fetchApprovedSchedules = async () => {
            if (!watchedAreaId || !watchedCompanyId) return;

            try {
                const selectedArea = areas.find(a => a.id === watchedAreaId);
                if (!selectedArea) return;

                const today = new Date().toISOString().split('T')[0];
                const res = await api.get(`/schedules?date=${today}&area=${selectedArea.name}&status=APROVADO`);

                if (res.data && res.data.length > 0) {
                    // Logic to merge approved schedules
                    const approvedSchedules = res.data;
                    const ids = approvedSchedules.map((s: any) => s.id);
                    setLinkedScheduleIds(prev => [...new Set([...prev, ...ids])]);

                    // Add collaborators
                    const currentCollabs = methods.getValues('collaboratorIds');
                    const newCollabs: string[] = [];
                    approvedSchedules.forEach((s: any) => {
                        const collab = collaborators.find((c: any) => c.name === s.collaborator);
                        if (collab) newCollabs.push(collab.id);
                    });

                    if (newCollabs.length > 0) {
                        setValue('collaboratorIds', [...new Set([...currentCollabs, ...newCollabs])]);
                    }

                    // Append to report
                    const currentReport = methods.getValues('relatos.colaborador') || '';
                    const reasons = approvedSchedules
                        .map((s: any) => `${s.collaborator}: ${s.reason || 'Sem motivo'}`)
                        .join('\n');

                    if (reasons && !currentReport.includes(reasons)) {
                        setValue('relatos.colaborador', currentReport ? `${currentReport}\n\n${reasons}` : reasons);
                    }
                }
            } catch (error) {
                console.error('Error pulling schedules', error);
            }
        };
        fetchApprovedSchedules();
    }, [watchedAreaId, watchedCompanyId, areas, collaborators, setValue, methods]);


    // Handle validation errors from react-hook-form
    const onError = (errors: any) => {
        console.error('Form Validation Errors:', errors);
        // Show first error as toast
        const firstError = Object.values(errors)[0] as any;
        if (firstError?.message) {
            toast.error(firstError.message);
        } else if (firstError?.root?.message) {
            toast.error(firstError.root.message);
        } else {
            toast.error('Verifique os campos obrigatórios');
        }
    };

    const onSubmit = async (data: VisitFormData) => {
        setLoading(true);
        try {
            // Inject system fields
            const payload = {
                ...data,
                // Ensure date/masterId are set if not present (though schema should catch/default)
                date: data.date || new Date().toISOString(),
                masterId: user?.id,
                // Zod handles other transformations
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
                const basePath = user?.role === 'RH' ? '/rh/visits' : '/dashboard';
                navigate(basePath);
            }
        } catch (error: any) {
            console.error('Save error', error);
            if (error.response?.data?.error?.issues) {
                // Zod server error
                error.response.data.error.issues.forEach((issue: any) => {
                    toast.error(`${issue.path.join('.')}: ${issue.message}`);
                });
            } else if (error.message) {
                toast.error(error.message);
            } else {
                toast.error('Erro ao salvar. Verifique os campos.');
            }
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
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Registrar Acompanhamento</h1>
                    <div className="flex space-x-3 items-center">
                        {!isValid && (
                            <div className="text-red-500 flex items-center text-sm mr-4 animate-pulse">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Preencha os campos obrigatórios
                            </div>
                        )}
                        <select
                            className={`input-field max-w-xs ${selectedCompanyId ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.companyId ? 'border-red-500' : ''}`}
                            {...methods.register('companyId')}
                            disabled={!!selectedCompanyId}
                        >
                            <option value="">Selecione a Empresa</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100">
                        <nav className="flex space-x-8 px-6 overflow-x-auto">
                            {tabs.map((tab, index) => (
                                <button
                                    type="button"
                                    key={tab.id}
                                    onClick={() => setActiveTab(index)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                                        ${activeTab === index
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 0 && (
                            <VisitReportsTab
                                areas={areas}
                                collaborators={collaborators}
                                onRefreshData={async () => {
                                    const [resAreas, resCollabs] = await Promise.all([
                                        api.get('/areas'),
                                        api.get('/collaborators')
                                    ]);
                                    setAreas(resAreas.data);
                                    setCollaborators(resCollabs.data.data || resCollabs.data);
                                }}
                            />
                        )}
                        {activeTab === 1 && <VisitEvaluationsTab />}
                        {activeTab === 2 && <VisitPendenciesTab />}
                        {activeTab === 3 && <VisitAttachmentsTab />}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
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
            </form>
        </FormProvider>
    );
};

export default VisitRecording;
