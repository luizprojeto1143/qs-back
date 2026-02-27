import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('Este navegador não suporta notificações.');
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                toast.success('Notificações ativadas!');
                // Here we would subscribe to the push service
                // const registration = await navigator.serviceWorker.ready;
                // const subscription = await registration.pushManager.subscribe(...)
            } else {
                toast.info('Permissão de notificação negada/fechada.');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    const sendLocalNotification = (title: string, options?: NotificationOptions) => {
        if (permission === 'granted') {
            new Notification(title, options);
        }
    };

    return { permission, requestPermission, sendLocalNotification };
}
