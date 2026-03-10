import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Download, MessageCircle, Mail, Eye, Calculator } from 'lucide-react';
import { CategorySection } from '../components/CategorySection';
import { QuoteModal } from '../components/QuoteModal';
import { PublicOperationToggle } from '../components/PublicOperationToggle';
import { ContainerSizeSelector, ContainerSize } from '../components/ContainerSizeSelector';
import { Logo } from '../components/Logo';
import { useCategories } from '../contexts/CategoryContext';
import { useOperation } from '../contexts/OperationContext';
import { Customer, Item, Quote } from '../types';
import { formatCurrency, generateWhatsAppLink, generateEmailLink } from '../utils/formatters';
import { generateQuotePDF } from '../services/pdfService';
import { fetchCEP } from '../services/cepService';
import { useQuotes } from '../contexts/QuoteContext';
import { applyPhoneMask, applyCepMask, removeMask } from '../utils/maskUtils';

const PURPOSE_OPTIONS = ['Pessoal', 'Comercial', 'Locação para Airbnb'];

export const PublicQuote: React.FC = () => {
  const { addQuote } = useQuotes();
  const { categories } = useCategories();
  const { operationType, isVenda } = useOperation();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<ContainerSize | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressInfo, setAddressInfo] = useState({ city: '', state: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Customer>();

  useEffect(() => {
    setSelectedItems([]);
    setSelectedContainer(null);
  }, [operationType]);

  useEffect(() => {
    console.log('PublicQuote - Modo:', operationType, '->', categories.length, 'categorias disponíveis');
  }, [operationType, categories]);

  const handleItemToggle = (item: Item) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected.id === item.id);
      if (exists) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleCEPChange = async (cep: string) => {
    if (cep.replace(/\D/g, '').length === 8) {
      const cepData = await fetchCEP(cep);
      if (cepData) {
        const fullAddress = `${cepData.logradouro}, ${cepData.bairro}, ${cepData.localidade}/${cepData.uf}`;
        setValue('address', fullAddress);
        setAddressInfo({ city: cepData.localidade, state: cepData.uf });
      }
    }
  };

  const totalPrice = (selectedContainer ? (isVenda ? selectedContainer.vendaPrice : selectedContainer.aluguelPrice) : 0) +
                    selectedItems.reduce((sum, item) => sum + item.price, 0);

  const basePrice = selectedContainer ? (isVenda ? selectedContainer.vendaPrice : selectedContainer.aluguelPrice) : 0;

  const createQuote = async (customerData: Customer): Promise<Quote | null> => {
    const quote: Quote = {
      id: Date.now().toString(),
      customer: {
        ...customerData,
        city: addressInfo.city,
        state: addressInfo.state,
      },
      selectedItems,
      basePrice: basePrice,
      totalPrice,
      operationType,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    try {
      const savedQuote = await addQuote(quote);
      return savedQuote;
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      return quote;
    }
  };

  const onSubmit = async (data: Customer) => {
    if (!selectedContainer) {
      alert('Por favor, selecione um tamanho de container antes de gerar o orçamento.');
      return;
    }

    const quote = await createQuote(data);
    if (quote) {
      setCurrentQuote(quote);
    }
  };

  const handleDownloadPDF = () => {
    if (currentQuote) {
      generateQuotePDF(currentQuote);
    }
  };

  const handleWhatsApp = () => {
    if (currentQuote) {
      window.open(generateWhatsAppLink(currentQuote), '_blank');
    }
  };

  const handleEmail = () => {
    if (currentQuote) {
      window.open(generateEmailLink(currentQuote), '_blank');
    }
  };

  const handleViewDetails = () => {
    if (currentQuote) {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-alencar-dark">
      <div className="bg-alencar-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(36,82,71,0.3),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Logo variant="horizontal" darkBackground={true} className="h-12 md:h-16" />

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Calculadora de Precos
              </h1>
              <p className="text-alencar-green-light text-lg md:text-xl max-w-xl mx-auto">
                Monte seu container personalizado com precos transparentes
              </p>
            </div>

            <PublicOperationToggle />

            {selectedContainer && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Calculator className="text-alencar-green-light" size={18} />
                <span>
                  Container {selectedContainer.size}: {formatCurrency(basePrice)}
                  {isVenda ? '' : ' mensal'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <ContainerSizeSelector
            selectedSize={selectedContainer}
            onSizeSelect={setSelectedContainer}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Selecione os itens desejados:</h3>
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                selectedItems={selectedItems}
                onItemToggle={handleItemToggle}
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-card shadow-xl p-6 sticky top-4 shadow-glow animate-fade-up">
              <h3 className="text-xl font-bold text-alencar-dark mb-4">Resumo do Orcamento</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Container base:</span>
                  <span className="font-semibold">
                    {selectedContainer ? formatCurrency(basePrice) : 'R$ 0,00'}
                  </span>
                </div>
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name}:</span>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mb-6">
                <div className="flex justify-between text-xl font-bold text-alencar-green">
                  <span>Total:</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-alencar-dark mb-4">Seus Dados</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Nome é obrigatório' })}
                      className="input-base"
                      placeholder="Digite seu nome completo"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone com DDD *
                    </label>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Telefone é obrigatório' })}
                      onChange={(e) => {
                        const maskedValue = applyPhoneMask(e.target.value);
                        e.target.value = maskedValue;
                        setValue('phone', removeMask(e.target.value));
                      }}
                      className="input-base"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'E-mail inválido'
                        }
                      })}
                      className="input-base"
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      {...register('cep', { required: 'CEP é obrigatório' })}
                      onChange={(e) => {
                        const maskedValue = applyCepMask(e.target.value);
                        e.target.value = maskedValue;
                        setValue('cep', maskedValue);
                        handleCEPChange(maskedValue);
                      }}
                      className="input-base"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {errors.cep && (
                      <p className="text-red-500 text-sm mt-1">{errors.cep.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereco da instalacao *
                    </label>
                    <input
                      type="text"
                      {...register('address', { required: 'Endereço é obrigatório' })}
                      className="input-base"
                      placeholder="Endereço será preenchido automaticamente"
                      readOnly
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data prevista para o projeto *
                    </label>
                    <input
                      type="date"
                      {...register('projectDate', { required: 'Data é obrigatória' })}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-base"
                    />
                    {errors.projectDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.projectDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Finalidade de uso do container * (multipla escolha)
                    </label>
                    <div className="space-y-2">
                      {PURPOSE_OPTIONS.map((purpose) => (
                        <label key={purpose} className="flex items-center">
                          <input
                            type="checkbox"
                            value={purpose}
                            {...register('purpose', { required: 'Selecione pelo menos uma finalidade' })}
                            className="mr-2 w-4 h-4 text-alencar-green rounded focus:ring-alencar-green accent-alencar-green"
                          />
                          <span className="text-sm text-gray-700">{purpose}</span>
                        </label>
                      ))}
                    </div>
                    {errors.purpose && (
                      <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedContainer}
                    className={`w-full py-4 rounded-button font-semibold text-lg shadow-lg transition-all ${
                      selectedContainer
                        ? 'btn-primary-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedContainer ? 'Gerar Orcamento' : 'Selecione um Container'}
                  </button>
                </form>
              </div>

              {currentQuote && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-bold text-alencar-dark mb-4">Orcamento Gerado!</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleDownloadPDF}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Gerar PDF
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-button hover:bg-green-700 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <MessageCircle size={20} />
                      Enviar via WhatsApp
                    </button>
                    <button
                      onClick={handleEmail}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-button hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Mail size={20} />
                      Enviar por E-mail
                    </button>
                    <button
                      onClick={handleViewDetails}
                      className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-button hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Eye size={20} />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="horizontal" darkBackground={true} className="h-8 opacity-60" />
          <p className="text-white/40 text-sm">
            Precisao, tecnologia e construcao inteligente.
          </p>
        </div>
      </div>

      {currentQuote && (
        <QuoteModal
          quote={currentQuote}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
