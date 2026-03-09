import React from 'react';
import { X, Download, MessageCircle, Mail } from 'lucide-react';
import { Quote } from '../types';
import { formatCurrency, generateWhatsAppLink, generateEmailLink } from '../utils/formatters';
import { generateQuotePDF } from '../services/pdfService';

interface QuoteModalProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ quote, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    generateQuotePDF(quote);
  };

  const handleWhatsApp = () => {
    window.open(generateWhatsAppLink(quote), '_blank');
  };

  const handleEmail = () => {
    window.open(generateEmailLink(quote), '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-alencar-dark text-white p-6 rounded-t-card">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Detalhes do Orçamento</h2>
              <p className="text-white/90">Alencar Empreendimentos</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-alencar-dark mb-3">Dados do Cliente</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-medium">{quote.customer.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <p className="font-medium">{quote.customer.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">E-mail:</span>
                  <p className="font-medium">{quote.customer.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Data do Projeto:</span>
                  <p className="font-medium">{quote.customer.projectDate}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">Endereço:</span>
                  <p className="font-medium">{quote.customer.address}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Finalidade:</span>
                  <p className="font-medium">{quote.customer.purpose.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-alencar-dark mb-3">Itens Selecionados</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Container Base</span>
                <span className="text-alencar-green font-semibold">{formatCurrency(quote.basePrice)}</span>
              </div>
              {quote.selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <span>{item.name}</span>
                  <span className="text-alencar-green font-semibold">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-alencar-green text-white p-4 rounded-card mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Total</span>
              <span className="text-2xl font-bold">{formatCurrency(quote.totalPrice)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDF}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
            >
              <Download size={20} />
              Baixar PDF
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-button hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={20} />
              WhatsApp
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-button hover:bg-blue-700 transition-colors"
            >
              <Mail size={20} />
              E-mail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
