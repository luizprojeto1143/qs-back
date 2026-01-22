import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface InstallButtonProps {
    className?: string;
    label?: string;
    icon?: React.ElementType;
    compact?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallButton = ({ className, label = "Baixar App", icon: Icon = Download, compact = false }: InstallButtonProps) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect if already installed/standalone
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone) {
            setIsStandalone(true);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            console.log('Install prompt captured');
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Check iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
        setIsIOS(isIosDevice);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else if (isIOS) {
            toast.info("Para instalar no iPhone:", {
                description: "1. Toque no botão 'Compartilhar' (quadrado com seta)\n2. Role para baixo e toque em 'Adicionar à Tela de Início'",
                duration: 8000,
                icon: <Smartphone className='w-5 h-5' />
            });
        } else {
            // Fallback instruction
            toast.info("Instalar Aplicativo", {
                description: "Acesse as configurações do seu navegador (três pontinhos) e selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.",
                duration: 6000,
                icon: <Download className='w-5 h-5' />
            });
        }
    };

    if (isStandalone) return null; // Don't show if already in app mode

    return (
        <button
            onClick={handleInstall}
            className={`flex items-center space-x-3 transition-colors ${className}`}
            type="button"
        >
            <Icon className="h-5 w-5" />
            {!compact && <span>{label}</span>}
        </button>
    );
};
