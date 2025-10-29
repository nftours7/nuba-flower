import React from 'react';
import Modal from './Modal';
import { useApp } from '../hooks/useApp';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  icon?: React.ElementType;
  iconColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText, icon: Icon, iconColor }) => {
  const { t } = useApp();

  const isConstructiveAction = !!confirmText;
  const buttonText = confirmText || t('delete');
  const buttonClass = isConstructiveAction
    ? "bg-primary text-white hover:bg-primary-dark focus:ring-primary"
    : "bg-accent text-white hover:bg-red-700 focus:ring-accent";
    
  const FinalIcon = Icon || AlertTriangle;
  const finalIconColor = Icon ? (iconColor || 'text-primary') : 'text-red-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <FinalIcon className={`w-16 h-16 ${finalIconColor} mb-4`} />
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center gap-4 w-full">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${buttonClass}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;