import React, { useEffect } from 'react';
import { X, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  error: <XCircle className="w-6 h-6 text-red-500" />,
  info: <Info className="w-6 h-6 text-blue-500" />,
};

const BORDER_COLORS = {
  success: 'border-green-500',
  error: 'border-red-500',
  info: 'border-blue-500',
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div className={`
      relative w-full max-w-sm p-4 bg-white rounded-lg shadow-lg pointer-events-auto
      flex items-start gap-3
      border-l-4 ${BORDER_COLORS[toast.type]}
      animate-toast-in
    `}>
      <div className="flex-shrink-0">
        {ICONS[toast.type]}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{toast.title}</p>
        <p className="text-sm text-gray-600">{toast.message}</p>
      </div>
      <button 
        onClick={() => onDismiss(toast.id)} 
        className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
