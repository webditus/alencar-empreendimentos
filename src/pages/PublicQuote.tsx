import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Download, MessageCircle, Mail, Eye, ArrowLeft, ShoppingBag, Home } from 'lucide-react';
import { CategorySection } from '../components/CategorySection';
import { QuoteModal } from '../components/QuoteModal';
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

const PURPOSE_OPTIONS = ['Pessoal', 'Comercial', 'Locacao para Airbnb'];

type Step = 'choose-operation' | 'configure';

export const PublicQuote: React.FC = () => {
  const { addQuote } = useQuotes();
  const { categories } = useCategories();
  const { operationType, setOperationType, isVenda } = useOperation();
  const [step, setStep] = useState<Step>('choose-operation');
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

  const handleOperationChoice = (type: 'venda' | 'aluguel') => {
    setOperationType(type);
    setSelectedItems([]);
    setSelectedContainer(null);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('choose-operation');
    setSelectedItems([]);
    setSelectedContainer(null);
    setCurrentQuote(null);
  };

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
      console.error('Erro ao salvar orcamento:', error);
      return quote;
    }
  };

  const onSubmit = async (data: Customer) => {
    if (!selectedContainer) {
      alert('Por favor, selecione um tamanho de container antes de gerar o orcamento.');
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
    <div className="min-h-screen bg-alencar-dark flex flex-col">
      <header className="bg-alencar-gradient border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Logo variant="horizontal" darkBackground={true} className="h-9 md:h-11 flex-shrink-0" />
          <p className="text-white/70 text-sm md:text-base text-right leading-snug">
            Monte seu container personalizado com precos transparentes
          </p>
        </div>
      </header>

      {step === 'choose-operation' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl text-center space-y-12">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Voce deseja comprar ou alugar um container?
              </h1>
              <p className="text-white/50 text-base">
                Escolha uma opcao para comecar a montar seu orcamento
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => handleOperationChoice('venda')}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d2b25] to-[#1a4a3a] p-8 text-left transition-all duration-300 hover:border-alencar-green/50 hover:shadow-[0_0_30px_rgba(36,82,71,0.4)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-alencar-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-alencar-green/20 flex items-center justify-center group-hover:bg-alencar-green/30 transition-colors duration-300">
                    <ShoppingBag size={32} className="text-alencar-green-light" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Comprar</h2>
                    <p className="text-white/50 text-sm">Adquira seu container definitivamente</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleOperationChoice('aluguel')}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d2b25] to-[#1a4a3a] p-8 text-left transition-all duration-300 hover:border-alencar-green/50 hover:shadow-[0_0_30px_rgba(36,82,71,0.4)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-alencar-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-alencar-green/20 flex items-center justify-center group-hover:bg-alencar-green/30 transition-colors duration-300">
                    <Home size={32} className="text-alencar-green-light" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Alugar</h2>
                    <p className="text-white/50 text-sm">Alugue por periodo com flexibilidade</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'configure' && (
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="text-sm font-medium">Voltar</span>
              </button>
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/40 text-sm">
                {isVenda ? 'Compra de Container' : 'Aluguel de Container'}
              </span>
            </div>

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
                <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 sticky top-24 shadow-glow animate-fade-up">
                  <h3 className="text-xl font-bold text-white mb-4">Resumo do Orcamento</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Container base:</span>
                      <span className="font-semibold text-white">
                        {selectedContainer ? formatCurrency(basePrice) : 'R$ 0,00'}
                      </span>
                    </div>
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-white/60">{item.name}:</span>
                        <span className="text-alencar-green-light">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-3 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-alencar-green-light">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Seus Dados</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Nome completo *
                        </label>
                        <input
                          type="text"
                          {...register('name', { required: 'Nome e obrigatorio' })}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
                          placeholder="Digite seu nome completo"
                        />
                        {errors.name && (
                          <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Telefone com DDD *
                        </label>
                        <input
                          type="tel"
                          {...register('phone', { required: 'Telefone e obrigatorio' })}
                          onChange={(e) => {
                            const maskedValue = applyPhoneMask(e.target.value);
                            e.target.value = maskedValue;
                            setValue('phone', removeMask(e.target.value));
                          }}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                        />
                        {errors.phone && (
                          <p className="text-red-300 text-sm mt-1">{errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          {...register('email', {
                            required: 'E-mail e obrigatorio',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'E-mail invalido'
                            }
                          })}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
                          placeholder="seu@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          CEP *
                        </label>
                        <input
                          type="text"
                          {...register('cep', { required: 'CEP e obrigatorio' })}
                          onChange={(e) => {
                            const maskedValue = applyCepMask(e.target.value);
                            e.target.value = maskedValue;
                            setValue('cep', maskedValue);
                            handleCEPChange(maskedValue);
                          }}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        {errors.cep && (
                          <p className="text-red-300 text-sm mt-1">{errors.cep.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Endereco da instalacao *
                        </label>
                        <input
                          type="text"
                          {...register('address', { required: 'Endereco e obrigatorio' })}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
                          placeholder="Endereco sera preenchido automaticamente"
                          readOnly
                        />
                        {errors.address && (
                          <p className="text-red-300 text-sm mt-1">{errors.address.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Data prevista para o projeto *
                        </label>
                        <input
                          type="date"
                          {...register('projectDate', { required: 'Data e obrigatoria' })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent [color-scheme:dark]"
                        />
                        {errors.projectDate && (
                          <p className="text-red-300 text-sm mt-1">{errors.projectDate.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Finalidade de uso do container * (multipla escolha)
                        </label>
                        <div className="space-y-2">
                          {PURPOSE_OPTIONS.map((purpose) => (
                            <label key={purpose} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={purpose}
                                {...register('purpose', { required: 'Selecione pelo menos uma finalidade' })}
                                className="w-4 h-4 text-alencar-green rounded focus:ring-alencar-green accent-alencar-green"
                              />
                              <span className="text-sm text-white/70">{purpose}</span>
                            </label>
                          ))}
                        </div>
                        {errors.purpose && (
                          <p className="text-red-300 text-sm mt-1">{errors.purpose.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedContainer}
                        className={`w-full py-4 rounded-button font-semibold text-lg shadow-lg transition-all ${
                          selectedContainer
                            ? 'btn-primary-lg'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {selectedContainer ? 'Gerar Orcamento' : 'Selecione um Container'}
                      </button>
                    </form>
                  </div>

                  {currentQuote && (
                    <div className="border-t border-white/10 pt-6 mt-6">
                      <h3 className="text-xl font-bold text-white mb-4">Orcamento Gerado!</h3>
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
                          className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-button hover:bg-white/20 transition-all duration-200 hover:scale-[1.02]"
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
        </div>
      )}

      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="horizontal" darkBackground={true} className="h-8 opacity-60" />
          <p className="text-white/40 text-sm">
            Precisao, tecnologia e construcao inteligente.
          </p>
        </div>
      </footer>

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
