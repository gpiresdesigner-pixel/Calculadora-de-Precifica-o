import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'success';
  confirmText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  variant = 'danger',
  confirmText 
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm shadow-2xl p-6 transform transition-all scale-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`p-3 rounded-full border ${isDanger ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            {isDanger ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg flex justify-center items-center gap-2
                ${isDanger 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                }`}
            >
              {confirmText || (isDanger ? 'Sim, Excluir' : 'Confirmar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;