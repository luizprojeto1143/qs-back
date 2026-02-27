import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface DiagnosisCategory {
    score: number;
    notes: string;
}

export interface DiagnosisData {
    [category: string]: DiagnosisCategory;
}

export const useInclusionDiagnosis = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState('');
    const [diagnosis, setDiagnosis] = useState<DiagnosisData>({});

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const selectedCompanyId = localStorage.getItem('selectedCompanyId') || user.companyId;

        if (!selectedCompanyId) {
            toast.error('Empresa não selecionada');
            navigate('/dashboard');
            return;
        }

        setCompanyId(selectedCompanyId);
        fetchDiagnosis();
    }, [navigate]);

    const fetchDiagnosis = async () => {
        try {
            // We fetch the report data to get the current diagnosis
            const res = await api.post('/reports', {
                type: 'INCLUSION_DIAGNOSIS',
                filters: {} // Context company ID is used automatically
            });

            if (res.data.success && res.data.data) {
                setDiagnosis(res.data.data.categories || {});
            }
        } catch (error) {
            console.error('Error fetching diagnosis', error);
            toast.error('Erro ao carregar diagnóstico');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (category: string, score: number) => {
        setDiagnosis((prev) => ({
            ...prev,
            [category]: { ...prev[category], score }
        }));
    };

    const handleNotesChange = (category: string, notes: string) => {
        setDiagnosis((prev) => ({
            ...prev,
            [category]: { ...prev[category], notes }
        }));
    };

    const saveDiagnosis = async () => {
        setSaving(true);
        try {
            await api.put(`/companies/${companyId}`, {
                inclusionDiagnosis: { categories: diagnosis }
            });
            toast.success('Diagnóstico salvo com sucesso!');
            navigate(-1);
        } catch (error) {
            console.error('Error saving diagnosis', error);
            toast.error('Erro ao salvar diagnóstico');
        } finally {
            setSaving(false);
        }
    };

    return {
        loading,
        saving,
        diagnosis,
        handleScoreChange,
        handleNotesChange,
        saveDiagnosis,
        navigate // Exposing navigate for Cancel button
    };
};
