'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

/**
 * Simple Toast Notification Component
 */
export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => onClose?.(), 300); // Wait for fade out animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!visible) return null;

    const icons = {
        success: <CheckCircle2 size={20} className="text-green-600" />,
        error: <XCircle size={20} className="text-red-600" />,
        warning: <AlertCircle size={20} className="text-amber-600" />,
        info: <Info size={20} className="text-blue-600" />,
    };

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            } ${styles[type]}`}
        >
            {icons[type]}
            <span className="font-medium text-sm">{message}</span>
            {onClose && (
                <button
                    onClick={() => {
                        setVisible(false);
                        setTimeout(() => onClose(), 300);
                    }}
                    className="ml-2 p-1 hover:bg-black/10 rounded transition-colors"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

/**
 * Toast Manager Hook
 */
export function useToast() {
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
        id: number;
    } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, id: Date.now() });
    };

    const ToastComponent = toast ? (
        <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
        />
    ) : null;

    return { showToast, ToastComponent };
}
