import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useCompany } from '../contexts/CompanyContext';

export const useLibrasAvailability = () => {
    const { selectedCompanyId } = useCompany();
    const [isLibrasAvailable, setIsLibrasAvailable] = useState(false);

    useEffect(() => {
        const checkAvailability = async () => {
            if (!selectedCompanyId) {
                setIsLibrasAvailable(false);
                return;
            }

            try {
                // Add timestamp to prevent caching
                const response = await api.get(`/libras/availability?t=${new Date().getTime()}`);
                setIsLibrasAvailable(response.data.available);
            } catch (error) {
                console.error('Error checking libras availability', error);
                setIsLibrasAvailable(false);
            }
        };

        checkAvailability();

        // Check every minute to update status in real-time
        const interval = setInterval(checkAvailability, 60000);

        return () => clearInterval(interval);
    }, [selectedCompanyId]);

    return { isLibrasAvailable };
};
