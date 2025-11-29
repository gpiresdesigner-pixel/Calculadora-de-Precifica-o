import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Send } from 'lucide-react';

interface SalesPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pitch: string;
  loading: boolean;
  clientPhone?: string;
}

const SalesPitchModal: React.FC<SalesPitchModalProps> = ({ isOpen, onClose, pitch, loading, clientPhone }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!clientPhone) {
      alert("Telefone do cliente não encontrado.");
      return;
    }
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitch)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-2xl shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-500 w-5 h-5" />
            Proposta Persuasiva (IA)
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-800 rounded w-full"></div>
              <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {pitch}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm order-3 sm:order-1"
          >
            Fechar
          </button>
          {!loading && (
            <>
              {clientPhone && (
                <button 
                  onClick={handleWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 order-1 sm:order-2"
                >
                  <Send size={16} /> Enviar WhatsApp
                </button>
              )}
              <button 
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all order-2 sm:order-3 ${
                  copied 
                    ? 'bg-zinc-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPitchModal;