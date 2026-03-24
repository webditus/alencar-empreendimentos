import React from 'react';
import { X, Download, MessageCircle, Mail } from 'lucide-react';
import { Quote } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink, generateEmailLink } from '../utils/formatters';
import { generateQuotePDF } from '../services/pdfService';
import { Logo } from './Logo';

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card shadow-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 animate-fade-up border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-alencar-gradient text-white p-6 rounded-t-card">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Logo variant="horizontal" darkBackground={true} className="h-8" />
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X size={22} />
            </button>
          </div>
          <h2 className="text-2xl font-bold mt-4">Detalhes do Orcamento</h2>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-alencar-dark">Dados do Cliente</h3>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-alencar-green/10 text-alencar-green border border-alencar-green/20">
                {quote.operationType === 'locacao' ? 'Locação' : 'Compra'}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-3">Informações pessoais</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-medium">{quote.customer.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <p className="font-medium">{quote.customer.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">E-mail:</span>
                  <p className="font-medium">{quote.customer.email}</p>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-3">Local do projeto</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-sm text-gray-600">CEP:</span>
                  <p className="font-medium">{quote.customer.cep || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Número:</span>
                  <p className="font-medium">{quote.customer.propertyNumber || 'Sem número'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">Endereço:</span>
                  <p className="font-medium">{quote.customer.address}</p>
                </div>
                {quote.customer.addressComplement && (
                  <div className="md:col-span-2">
                    <span className="text-sm text-gray-600">Complemento:</span>
                    <p className="font-medium">{quote.customer.addressComplement}</p>
                  </div>
                )}
              </div>

              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-3">Contexto do projeto</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quote.customer.installationLocation && (
                  <div>
                    <span className="text-sm text-gray-600">Local de instalação:</span>
                    <p className="font-medium">{
                      quote.customer.installationLocation === 'Outro' && quote.customer.installationLocationOther
                        ? quote.customer.installationLocationOther
                        : quote.customer.installationLocation
                    }</p>
                  </div>
                )}
                {quote.customer.projectStartTimeline && (
                  <div>
                    <span className="text-sm text-gray-600">Prazo para início:</span>
                    <p className="font-medium">{quote.customer.projectStartTimeline}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Data prevista:</span>
                  <p className="font-medium">{quote.customer.projectDate ? formatDate(quote.customer.projectDate) : 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Finalidade:</span>
                  <p className="font-medium">{quote.customer.purpose.map(p =>
                    p === 'Outro' && quote.customer.purposeOther ? quote.customer.purposeOther : p
                  ).join(', ')}</p>
                </div>
                {quote.customer.generalNotes && (
                  <div className="md:col-span-2">
                    <span className="text-sm text-gray-600">Observações:</span>
                    <p className="font-medium">{quote.customer.generalNotes}</p>
                  </div>
                )}
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

          <div className="bg-gradient-to-r from-alencar-green to-alencar-hover text-white p-4 rounded-card mb-6">
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
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-button hover:bg-green-700 transition-all duration-200 hover:scale-[1.02]"
            >
              <MessageCircle size={20} />
              WhatsApp
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-button hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02]"
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
