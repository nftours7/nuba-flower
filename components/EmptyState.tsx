import React from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useApp } from '../hooks/useApp';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, actionText, onAction }) => {
    const { t } = useApp();
    const isReset = actionText === t('resetFilters');
    
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl shadow-md animate-fade-in">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Icon className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <p className="mt-2 text-gray-500 max-w-sm">{message}</p>
            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isReset 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                >
                    {isReset ? <X className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    <span>{actionText}</span>
                </button>
            )}
        </div>
    );
};

export default EmptyState;