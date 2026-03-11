import React from 'react';
import { Download, MessageCircle, Mail, Eye } from 'lucide-react';

interface QuoteActionsProps {
  onDownloadPDF: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onViewDetails: () => void;
}

export const QuoteActions: React.FC<QuoteActionsProps> = ({
  onDownloadPDF,
  onWhatsApp,
  onEmail,
  onViewDetails,
}) => {
  return (
    <div className="border-t border-white/10 pt-6 mt-6">
      <h3 className="text-xl font-bold text-white mb-4">Orçamento gerado com sucesso!</h3>
      <div className="space-y-3">
        <button
          onClick={onDownloadPDF}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Gerar PDF
        </button>
        <button
          onClick={onWhatsApp}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-button hover:bg-green-700 transition-all duration-200 hover:scale-[1.02]"
        >
          <MessageCircle size={20} />
          Enviar via WhatsApp
        </button>
        <button
          onClick={onEmail}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-button hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02]"
        >
          <Mail size={20} />
          Enviar por E-mail
        </button>
        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-button hover:bg-white/20 transition-all duration-200 hover:scale-[1.02]"
        >
          <Eye size={20} />
          Ver Detalhes
        </button>
      </div>
    </div>
  );
};
