
import { useState, useEffect, useRef } from 'react';
import { Mic, Upload, CheckCircle, X, Square, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

import { useCompany } from '../contexts/CompanyContext';
import { api } from '../lib/api';

const VisitRecording = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedCompanyId, companies: contextCompanies } = useCompany();
    const [activeTab, setActiveTab] = useState(0);
    const [companies, setCompanies] = useState<any[]>(contextCompanies);
    const [areas, setAreas] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [linkedScheduleIds, setLinkedScheduleIds] = useState<string[]>([]);
    const [individualNotes, setIndividualNotes] = useState<{ collaboratorId: string; content: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState<string | null>(null); // 'lideranca' | 'colaborador' | null
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pendency Modal State
    const [isPendencyModalOpen, setIsPendencyModalOpen] = useState(false);
    const [newPendency, setNewPendency] = useState({
        description: '',
        responsible: '',
        priority: 'MEDIA',
        deadline: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        companyId: selectedCompanyId || '',
        areaId: '',
        collaboratorIds: [] as string[],
        relatos: {
            lideranca: '',
            colaborador: '',
            observacoes: '',
            audioLideranca: null as string | null,
            audioColaborador: null as string | null
        },
        avaliacoes: {
            area: {},
            lideranca: {},
            colaborador: {}
        },
        pendencias: [] as any[],
        anexos: [] as any[]
    });

    // Update formData when selectedCompanyId changes
    useEffect(() => {
        if (selectedCompanyId) {
            setFormData(prev => ({ ...prev, companyId: selectedCompanyId }));


            const fetchData = async () => {
                try {
                    // Use context companies if available, otherwise fetch (fallback)
                    if (contextCompanies.length > 0) {
                        setCompanies(contextCompanies);
                    } else {
                        const resStructure = await api.get('/structure');
                        const structure = resStructure.data;
                        if (structure.company) setCompanies([structure.company]);
                    }

                    // Fetch Areas and Collaborators
                    const [resAreas, resCollaborators] = await Promise.all([
                        api.get('/areas'),
                        api.get('/collaborators')
                    ]);

                    setAreas(resAreas.data);
                    setCollaborators(resCollaborators.data);

                    // Handle Schedule Integration (Auto-Grouping)
                    if (location.state && location.state.scheduleId) {
                        const { scheduleId, companyId, areaName, date } = location.state;

                        // 1. Set Company
                        if (companyId) {
                            setFormData(prev => ({ ...prev, companyId }));
                        }

                        // 2. Find and Set Area
                        if (areaName) {
                            const area = resAreas.data.find((a: any) => a.name === areaName);
                            if (area) {
                                setFormData(prev => ({ ...prev, areaId: area.id }));

                                // 3. Auto-Group: Fetch other schedules for this Area + Date + Company
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

                                // Collect IDs and Collaborators
                                const ids = relatedSchedules.map((s: any) => s.id);
                                if (!ids.includes(scheduleId)) ids.push(scheduleId);

                                setLinkedScheduleIds(ids);

                                // Add Collaborators
                                const collaboratorsToAdd: string[] = [];
                                relatedSchedules.forEach((s: any) => {
                                    const collab = resCollaborators.data.find((c: any) => c.name === s.collaborator);
                                    if (collab && !collaboratorsToAdd.includes(collab.id)) {
                                        collaboratorsToAdd.push(collab.id);
                                    }
                                });

                                if (location.state.collaboratorName) {
                                    const initialCollab = resCollaborators.data.find((c: any) => c.name === location.state.collaboratorName);
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
                // Fetch schedules
                const res = await api.get('/schedules');
                if (res.data) {
                    const allSchedules = res.data;

                    // Filter: Status APROVADO, Same Company, Same Area, Today (or recent?)
                    const today = new Date().toISOString().split('T')[0];

                    // Find the area name to match (since schedule stores area name currently)
                    const selectedArea = areas.find(a => a.id === formData.areaId);
                    const areaName = selectedArea?.name;

                    if (!areaName) return;

                    const approvedSchedules = allSchedules.filter((s: any) => {
                        const sDate = new Date(s.date).toISOString().split('T')[0];
                        return s.status === 'APROVADO' &&
                            s.area === areaName &&
                            sDate === today &&
                            (!formData.companyId || s.companyId === formData.companyId);
                    });

                    if (approvedSchedules.length > 0) {
                        // 1. Link Schedules
                        const ids = approvedSchedules.map((s: any) => s.id);
                        setLinkedScheduleIds(prev => [...new Set([...prev, ...ids])]);

                        // 2. Add Collaborators
                        const collaboratorsToAdd: string[] = [];
                        approvedSchedules.forEach((s: any) => {
                            const collab = collaborators.find((c: any) => c.name === s.collaborator);
                            if (collab) collaboratorsToAdd.push(collab.id);
                        });

                        setFormData(prev => {
                            // 3. Pre-fill Report (Concatenate reasons)
                            // Only append if not already present to avoid duplication on re-renders
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
                }
            } catch (error) {
                console.error('Error fetching approved schedules', error);
            }
        };

        fetchApprovedSchedules();
    }, [formData.areaId, formData.companyId, areas, collaborators]);

    // --- Voice Recording Logic ---
    const startRecording = async (field: 'lideranca' | 'colaborador') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });

                // Upload Audio
                const audioFile = new File([blob], `audio-${field}-${Date.now()}.webm`, { type: 'audio/webm' });
                const formDataUpload = new FormData();
                formDataUpload.append('file', audioFile);

                try {
                    const res = await api.post('/upload', formDataUpload, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    setFormData(prev => ({
                        ...prev,
                        relatos: {
                            ...prev.relatos,
                            [field === 'lideranca' ? 'audioLideranca' : 'audioColaborador']: res.data.url
                        }
                    }));
                    toast.success('Áudio gravado e salvo!');
                } catch (error) {
                    console.error('Upload error', error);
                    toast.error('Erro ao salvar áudio');
                }

                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(field);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error('Error accessing microphone', err);
            toast.error('Erro ao acessar microfone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(null);
            setMediaRecorder(null);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- File Upload Logic ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            try {
                const res = await api.post('/upload', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setFormData(prev => ({
                    ...prev,
                    anexos: [...prev.anexos, {
                        name: file.name,
                        url: res.data.url,
                        type: file.type,
                        size: file.size
                    }]
                }));
                toast.success('Arquivo enviado com sucesso!');
            } catch (error) {
                console.error('Upload error', error);
                toast.error('Erro ao enviar arquivo');
            }
        }
    };

    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            anexos: prev.anexos.filter((_, i) => i !== index)
        }));
    };

    // --- Pendency Logic ---
    const handlePendencySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormData(prev => ({
            ...prev,
            pendencias: [...prev.pendencias, { ...newPendency, id: Date.now().toString() }] // Temp ID
        }));
        setNewPendency({ description: '', responsible: '', priority: 'MEDIA', deadline: '' });
        setIsPendencyModalOpen(false);
        toast.success('Pendência adicionada à lista!');
    };

    const removePendency = (index: number) => {
        setFormData(prev => ({
            ...prev,
            pendencias: prev.pendencias.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                individualNotes
            };
            const response = await api.post('/visits', payload);

            if (response.status === 200 || response.status === 201) {
                // Update linked schedules status
                if (linkedScheduleIds.length > 0) {
                    await Promise.all(linkedScheduleIds.map(id =>
                        api.put(`/schedules/${id}`, { status: 'REALIZADO' })
                    ));
                }

                toast.success('Acompanhamento salvo com sucesso!');
                navigate('/dashboard');
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
                {/* Tabs Header */}
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
                                        onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                                        value={formData.areaId}
                                    >
                                        <option value="">Selecione a Área</option>
                                        {areas
                                            .filter(a => !formData.companyId || (a.sector && a.sector.companyId === formData.companyId))
                                            .map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        {formData.relatos.audioLideranca ? (
                                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                                                <audio src={formData.relatos.audioLideranca} controls className="h-6 w-48" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, relatos: { ...prev.relatos, audioLideranca: null } }))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : isRecording === 'lideranca' ? (
                                            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full animate-pulse">
                                                <span className="text-xs font-medium text-red-600">Gravando {formatTime(recordingTime)}</span>
                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                >
                                                    <Square size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => startRecording('lideranca')}
                                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors"
                                                title="Gravar áudio"
                                            >
                                                <Mic className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
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
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        {formData.relatos.audioColaborador ? (
                                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                                                <audio src={formData.relatos.audioColaborador} controls className="h-6 w-48" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, relatos: { ...prev.relatos, audioColaborador: null } }))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : isRecording === 'colaborador' ? (
                                            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full animate-pulse">
                                                <span className="text-xs font-medium text-red-600">Gravando {formatTime(recordingTime)}</span>
                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                >
                                                    <Square size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => startRecording('colaborador')}
                                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors"
                                                title="Gravar áudio"
                                            >
                                                <Mic className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Individual Notes Section */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-lg font-medium text-gray-900">Observações Individuais</h3>
                                {formData.collaboratorIds.length === 0 ? (
                                    <p className="text-sm text-gray-500">Selecione colaboradores para adicionar observações individuais.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {formData.collaboratorIds.map(collabId => {
                                            const collab = collaborators.find(c => c.id === collabId);
                                            const note = individualNotes.find(n => n.collaboratorId === collabId)?.content || '';

                                            return (
                                                <div key={collabId} className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {collab?.name || 'Colaborador'}
                                                    </label>
                                                    <textarea
                                                        className="input-field"
                                                        rows={2}
                                                        placeholder={`Observação sobre ${collab?.name?.split(' ')[0]}...`}
                                                        value={note}
                                                        onChange={e => {
                                                            const newContent = e.target.value;
                                                            setIndividualNotes(prev => {
                                                                const existing = prev.find(n => n.collaboratorId === collabId);
                                                                if (existing) {
                                                                    return prev.map(n => n.collaboratorId === collabId ? { ...n, content: newContent } : n);
                                                                }
                                                                return [...prev, { collaboratorId: collabId, content: newContent }];
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Avaliações */}
                    {activeTab === 1 && (
                        <div className="space-y-6">
                            {[
                                { id: 'area', label: 'Avaliação da Área' },
                                { id: 'lideranca', label: 'Avaliação da Liderança' },
                                { id: 'colaborador', label: 'Avaliação do Colaborador' }
                            ].map((section) => (
                                <div key={section.id} className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900">{section.label}</h3>
                                    <div className="grid gap-4">
                                        {['Comunicação', 'Acolhimento', 'Acessibilidade', 'Relacionamento', 'Postura'].map((item) => (
                                            <div key={item} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                                <span className="text-sm font-medium text-gray-700">{item}</span>
                                                <div className="flex space-x-2">
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <button
                                                            type="button"
                                                            key={rating}
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    avaliacoes: {
                                                                        ...prev.avaliacoes,
                                                                        [section.id]: {
                                                                            ...(prev.avaliacoes as any)[section.id],
                                                                            [item]: rating
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all text-sm font-medium
                                                    ${((formData.avaliacoes as any)[section.id]?.[item] === rating)
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:border-blue-200'
                                                                }
                                                `}
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
                                <button
                                    type="button"
                                    onClick={() => setIsPendencyModalOpen(true)}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Nova Pendência</span>
                                </button>
                            </div>

                            {formData.pendencias.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <p>Nenhuma pendência registrada para este acompanhamento.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.pendencias.map((p, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{p.description}</h4>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.priority === 'ALTA' ? 'bg-red-100 text-red-800' :
                                                        p.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {p.priority === 'MEDIA' ? 'Média' : p.priority === 'ALTA' ? 'Alta' : 'Baixa'}
                                                    </span>
                                                    <span>{p.responsible}</span>
                                                    <span>{p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePendency(index)}
                                                className="text-gray-400 hover:text-red-500 p-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Anexos */}
                    {activeTab === 3 && (
                        <div className="space-y-6">
                            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="image/*,application/pdf,video/*"
                                />
                                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                <p className="mt-2 text-sm font-medium text-gray-900">Clique para enviar arquivo</p>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF, MP4 até 10MB</p>
                            </label>

                            {formData.anexos.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {formData.anexos.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-gray-100 p-2 rounded-lg">
                                                    <Upload size={20} className="text-gray-500" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="text-gray-400 hover:text-red-500 p-2"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {/* Pendency Modal */}
            {
                isPendencyModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Nova Pendência</h2>
                                <button type="button" onClick={() => setIsPendencyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handlePendencySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        required
                                        className="input-field"
                                        rows={3}
                                        value={newPendency.description}
                                        onChange={e => setNewPendency({ ...newPendency, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={newPendency.responsible}
                                            onChange={e => setNewPendency({ ...newPendency, responsible: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={newPendency.deadline}
                                            onChange={e => setNewPendency({ ...newPendency, deadline: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select
                                        className="input-field"
                                        value={newPendency.priority}
                                        onChange={e => setNewPendency({ ...newPendency, priority: e.target.value })}
                                    >
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsPendencyModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Adicionar Pendência
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default VisitRecording;
