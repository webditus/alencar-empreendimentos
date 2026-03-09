import React, { useState, useEffect } from 'react';
import { Quote } from '../types';
import { useQuotes } from '../contexts/QuoteContext';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
import { User, Phone, Mail, DollarSign, Calendar, Eye, RefreshCw, MoreVertical, Clock } from 'lucide-react';

const KANBAN_COLUMNS = [
  {
    id: 'new',
    title: 'Novos',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    count: 0
  },
  {
    id: 'analyzing',
    title: 'Analisando',
    gradient: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    count: 0
  },
  {
    id: 'negotiating',
    title: 'Negociando',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    count: 0
  },
  {
    id: 'awaiting-signature',
    title: 'Aguardando Assinatura',
    gradient: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    count: 0
  },
  {
    id: 'approved',
    title: 'Aprovado',
    gradient: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    count: 0
  },
  {
    id: 'awaiting-payment',
    title: 'Aguardando Pagamento',
    gradient: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
    count: 0
  },
  {
    id: 'paid',
    title: 'Pago',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    count: 0
  },
  {
    id: 'rejected',
    title: 'Rejeitado',
    gradient: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    count: 0
  },
  {
    id: 'completed',
    title: 'Concluído',
    gradient: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    count: 0
  },
];

interface QuoteCardProps {
  quote: Quote;
  onViewDetails: (quote: Quote) => void;
  onDragStart: (e: React.DragEvent, quote: Quote) => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onViewDetails, onDragStart }) => {
  const getDaysSinceCreated = (date: string) => {
    const created = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSince = getDaysSinceCreated(quote.createdAt);
  const isUrgent = daysSince > 7;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, quote)}
      className="bg-white rounded-xl shadow-md p-4 mb-3 border-l-4 border-alencar-green cursor-move hover:shadow-lg transition-all duration-200 group relative overflow-hidden backdrop-blur-sm"
    >
      {isUrgent && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
          <Clock className="w-3 h-3" />
          {daysSince}d
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-8 h-8 bg-alencar-green rounded-full flex items-center justify-center shadow-sm mr-3">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {quote.customer.name}
            </h3>
            <p className="text-xs text-gray-500">#{quote.id}</p>
          </div>
        </div>
        <button
          onClick={() => onViewDetails(quote)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-alencar-green hover:text-alencar-hover p-2 rounded-full hover:bg-gray-50"
          title="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="h-3 w-3 mr-2 text-gray-400" />
            <span className="truncate">{formatPhone(quote.customer.phone)}</span>
          </div>
          <div className="flex items-center text-sm font-semibold text-alencar-green">
            <DollarSign className="h-4 w-4 mr-1" />
            {formatCurrency(quote.totalPrice)}
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-600">
          <Mail className="h-3 w-3 mr-2 text-gray-400" />
          <span className="truncate">{quote.customer.email}</span>
        </div>

        <div className="flex items-center text-xs text-gray-600">
          <Calendar className="h-3 w-3 mr-2 text-gray-400" />
          <span>{formatDate(quote.createdAt)}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {quote.selectedItems.length} itens
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
          {quote.customer.city}/{quote.customer.state}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-alencar-green opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none rounded-xl"></div>
    </div>
  );
};

export const KanbanBoard: React.FC = () => {
  const { quotes, updateQuote, refreshQuotes } = useQuotes();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedQuote, setDraggedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    refreshQuotes();
  }, []);

  const getQuotesByStatus = (status: string): Quote[] => {
    return quotes.filter(quote => quote.status === status);
  };

  const handleDragStart = (e: React.DragEvent, quote: Quote) => {
    setDraggedQuote(quote);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');

    if (draggedQuote && draggedQuote.status !== newStatus) {
      try {
        await updateQuote(draggedQuote.id, {
          status: newStatus as Quote['status']
        });
      } catch (error) {
        console.error('Erro ao atualizar status do kanban:', error);
      }
    }
    setDraggedQuote(null);
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowModal(true);
  };

  const getStatusColor = (status: Quote['status']) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'analyzing': 'bg-yellow-100 text-yellow-800',
      'negotiating': 'bg-orange-100 text-orange-800',
      'awaiting-signature': 'bg-cyan-100 text-cyan-800',
      'approved': 'bg-green-100 text-green-800',
      'awaiting-payment': 'bg-sky-100 text-sky-800',
      'paid': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Kanban de Orçamentos</h2>
          <p className="text-gray-600">Acompanhe o status dos seus orçamentos em tempo real</p>
        </div>
        <button
          onClick={refreshQuotes}
          className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {KANBAN_COLUMNS.map((column) => {
          const columnQuotes = getQuotesByStatus(column.id);

          return (
            <div key={column.id} className="min-w-[320px] flex-shrink-0">
              <div
                className={`${column.bgColor} ${column.borderColor} rounded-2xl border-2 p-5 min-h-[500px] backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${column.gradient}`}></div>
                    <h3 className={`font-bold text-sm ${column.textColor}`}>
                      {column.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${column.textColor} text-xs font-semibold px-3 py-1 rounded-full bg-white shadow-sm`}>
                      {columnQuotes.length}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded-full">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {columnQuotes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">Nenhum orçamento</p>
                    </div>
                  ) : (
                    columnQuotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        onViewDetails={handleViewDetails}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-card shadow-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalhes do Orçamento - {selectedQuote.customer.name}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  x
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Dados do Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nome:</strong> {selectedQuote.customer.name}</p>
                    <p><strong>Telefone:</strong> {formatPhone(selectedQuote.customer.phone)}</p>
                    <p><strong>E-mail:</strong> {selectedQuote.customer.email}</p>
                    <p><strong>CEP:</strong> {selectedQuote.customer.cep}</p>
                    <p><strong>Endereço:</strong> {selectedQuote.customer.address}</p>
                    <p><strong>Cidade/Estado:</strong> {selectedQuote.customer.city}/{selectedQuote.customer.state}</p>
                    <p><strong>Data do Projeto:</strong> {formatDate(selectedQuote.customer.projectDate)}</p>
                    <p><strong>Finalidade:</strong> {selectedQuote.customer.purpose.join(', ')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Dados do Orçamento</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Valor Base:</strong> {formatCurrency(selectedQuote.basePrice)}</p>
                    <p><strong>Valor Total:</strong> {formatCurrency(selectedQuote.totalPrice)}</p>
                    <p><strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedQuote.status)}`}>
                        {selectedQuote.status}
                      </span>
                    </p>
                    <p><strong>Data de Criação:</strong> {formatDate(selectedQuote.createdAt)}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Itens Selecionados</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedQuote.selectedItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.category}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-button hover:bg-gray-400 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
