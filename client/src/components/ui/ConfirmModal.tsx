import { useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Modal de confirmação acessível para substituir confirm() nativo
 * Atende WCAG 2.1 com focus trap, aria labels, e suporte a teclado
 */
export const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning',
    onConfirm,
    onCancel
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-description"
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-100' :
                        variant === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                        <AlertTriangle className={`h-6 w-6 ${variant === 'danger' ? 'text-red-600' :
                            variant === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                    </div>
                    <div className="flex-1">
                        <h3
                            id="confirm-modal-title"
                            className="text-lg font-bold text-gray-900"
                        >
                            {title}
                        </h3>
                        <p
                            id="confirm-modal-description"
                            className="text-sm text-gray-600 mt-1"
                        >
                            {message}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                        aria-label="Fechar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        autoFocus
                        className={`px-4 py-2 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${variantStyles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook para usar o modal de confirmação de forma imperativa
 */
export const useConfirmModal = () => {
    const [state, setState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info';
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'warning',
        resolve: null
    });

    const confirm = useCallback((
        title: string,
        message: string,
        variant: 'danger' | 'warning' | 'info' = 'warning'
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title,
                message,
                variant,
                resolve
            });
        });
    }, []);

    const { resolve } = state;

    const handleConfirm = useCallback(() => {
        resolve?.(true);
        setState(prev => ({ ...prev, isOpen: false, resolve: null }));
    }, [resolve]);

    const handleCancel = useCallback(() => {
        resolve?.(false);
        setState(prev => ({ ...prev, isOpen: false, resolve: null }));
    }, [resolve]);

    const ConfirmModalComponent = () => (
        <ConfirmModal
            isOpen={state.isOpen}
            title={state.title}
            message={state.message}
            variant={state.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return { confirm, ConfirmModalComponent };
};
