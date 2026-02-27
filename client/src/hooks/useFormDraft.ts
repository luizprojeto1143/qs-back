import { useState, useEffect, useCallback } from 'react';
import { storage } from '../lib/storage';

export function useFormDraft<T>(key: string, initialValue: T) {
    const [formData, setFormData] = useState<T>(initialValue);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    // Load draft on mount
    useEffect(() => {
        const savedDraft = storage.get(`draft_${key}`);
        if (savedDraft) {
            setFormData(savedDraft);
            setIsDraftLoaded(true);
        }
    }, [key]);

    // Save draft on change (debounced 1s)
    useEffect(() => {
        const handler = setTimeout(() => {
            if (formData) {
                storage.set(`draft_${key}`, formData);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [key, formData]);

    const clearDraft = useCallback(() => {
        storage.remove(`draft_${key}`);
        setFormData(initialValue);
    }, [key, initialValue]);

    return { formData, setFormData, clearDraft, isDraftLoaded };
}
