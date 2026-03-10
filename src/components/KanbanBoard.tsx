import React, { useState, useEffect } from 'react';
import { Quote } from '../types';
import { useQuotes } from '../contexts/QuoteContext';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
import { Eye, RefreshCw, Clock } from 'lucide-react';

const KANBAN_COLUMNS = [
  {
    id: 'new',
    title: 'Novos',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    id: 'analyzing',
    title: 'Analisando',
    gradient: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    id: 'negotiating',
    title: 'Negociando',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
  },
  {
    id: 'awaiting-signature',
    title: 'Aguard. Assinatura',
    gradient: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
  {
    id: 'approved',
    title: 'Aprovado',
    gradient: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  {
    id: 'awaiting-payment',
    title: 'Aguard. Pagamento',
    gradient: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
  },
  {
    id: 'paid',
    title: 'Pago',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    id: 'rejected',
    title: 'Rejeitado',
    gradient: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  {
    id: 'completed',
    title: 'Concluído',
    gradient: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
  },
];

interface QuoteCardProps {
  quote: Quote;
  onViewDetails: (quote: Quote) => void;
  onDragStart: (e: React.DragEvent, quote: Quote) => void;
}

const getDaysSinceCreated = (date: string) => {
  const created = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getAgeBadgeStyle = (days: number) => {
  if (days > 14) return 'bg-red-100 text-red-600';
  if (days > 7) return 'bg-amber-100 text-amber-600';
  return 'bg-gray-100 text-gray-500';
};

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onViewDetails, onDragStart }) => {
  const daysSince = getDaysSinceCreated(quote.createdAt);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, quote)}
      onClick={() => onViewDetails(quote)}
      className="bg-white rounded-lg shadow-sm px-3 py-2 border-l-[3px] border-alencar-green cursor-move hover:shadow-md transition-all duration-150 group relative"
    >
      <div className="flex items-start justify-between gap-1">
        <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
          {quote.customer.name}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getAgeBadgeStyle(daysSince)}`}>
            <Clock className="w-2.5 h-2.5" />
            {daysSince}d
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(quote); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-alencar-green hover:text-alencar-hover p-0.5 rounded"
            title="Ver detalhes"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        {quote.customer.city}/{quote.customer.state}
      </p>
      <p className="text-sm font-semibold text-alencar-green mt-1">
        {formatCurrency(quote.totalPrice)}
      </p>
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
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-900">Kanban de Orçamentos</h2>
        <button
          onClick={refreshQuotes}
          className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto overflow-y-hidden h-[calc(100vh-140px)] pb-2">
        {KANBAN_COLUMNS.map((column) => {
          const columnQuotes = getQuotesByStatus(column.id);
          const columnTotal = columnQuotes.reduce((sum, q) => sum + q.totalPrice, 0);

          return (
            <div
              key={column.id}
              className="w-[280px] min-w-[280px] flex-shrink-0 flex flex-col"
            >
              <div
                className={`${column.bgColor} ${column.borderColor} rounded-xl border flex flex-col h-full`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className={`sticky top-0 z-10 ${column.bgColor} rounded-t-xl px-3 py-2 border-b ${column.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${column.gradient} flex-shrink-0`}></div>
                      <h3 className={`font-semibold text-xs uppercase tracking-wide ${column.textColor} truncate`}>
                        {column.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap ml-2">
                      {columnQuotes.length} &bull; {formatCurrency(columnTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
                  {columnQuotes.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-xs">Nenhum orçamento</p>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
