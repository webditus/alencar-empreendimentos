import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ShoppingBag, Home, ArrowRight } from 'lucide-react';
import { CategorySection } from '../components/CategorySection';
import { QuoteModal } from '../components/QuoteModal';
import { ContainerSizeSelector, ContainerSize } from '../components/ContainerSizeSelector';
import { BudgetSummaryContent } from '../components/BudgetSummaryContent';
import { MobileBudgetBar } from '../components/MobileBudgetBar';
import { StepIndicator } from '../components/StepIndicator';
import { ClientForm } from '../components/ClientForm';
import { QuoteActions } from '../components/QuoteActions';
import { Logo } from '../components/Logo';
import { useCategories } from '../contexts/CategoryContext';
import { useOperation } from '../contexts/OperationContext';
import { Customer, Item, Quote } from '../types';
import { generateWhatsAppLink, generateEmailLink } from '../utils/formatters';
import { generateQuotePDF } from '../services/pdfService';
import { useQuotes } from '../contexts/QuoteContext';

const DESKTOP_LABELS = ['Operacao', 'Container', 'Itens e Dados'];
const MOBILE_LABELS = ['Operacao', 'Container', 'Itens', 'Seus Dados'];

export const PublicQuote: React.FC = () => {
  const { addQuote } = useQuotes();
  const { categories } = useCategories();
  const { operationType, setOperationType, isVenda } = useOperation();

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

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
    watch,
  } = useForm<Customer>();

  const totalSteps = isMobile ? 4 : 3;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (currentStep > totalSteps) {
      setCurrentStep(totalSteps);
    }
  }, [totalSteps, currentStep]);

  useEffect(() => {
    setHighestStepReached(prev => Math.max(prev, currentStep));
  }, [currentStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    setSelectedItems([]);
    setSelectedContainer(null);
  }, [operationType]);

  const handleOperationChoice = (type: 'venda' | 'aluguel') => {
    setOperationType(type);
    setSelectedItems([]);
    setSelectedContainer(null);
    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedItems([]);
      setSelectedContainer(null);
      setCurrentQuote(null);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleStepClick = useCallback((step: number) => {
    if (step === 1) {
      setSelectedItems([]);
      setSelectedContainer(null);
      setCurrentQuote(null);
    }
    setCurrentStep(step);
  }, []);

  const handleItemToggle = (item: Item) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected.id === item.id);
      if (exists) {
        return prev.filter(selected => selected.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const totalPrice =
    (selectedContainer ? (isVenda ? selectedContainer.vendaPrice : selectedContainer.aluguelPrice) : 0) +
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
      basePrice,
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
      generateQuotePDF({ quote: currentQuote, selectedContainer });
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

  const stepLabels = isMobile ? MOBILE_LABELS : DESKTOP_LABELS;

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

      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        highestStepReached={highestStepReached}
        onStepClick={handleStepClick}
        labels={stepLabels}
      />

      {currentStep === 1 && (
        <StepOperationChoice onChoose={handleOperationChoice} />
      )}

      {currentStep === 2 && (
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
            <StepHeader
              onBack={handleBack}
              label={isVenda ? 'Compra de Container' : 'Aluguel de Container'}
            />
            <div className="mb-10">
              <ContainerSizeSelector
                selectedSize={selectedContainer}
                onSizeSelect={setSelectedContainer}
              />
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNext}
                disabled={!selectedContainer}
                className={`flex items-center gap-2 px-8 py-3 rounded-button font-semibold transition-all duration-200 ${
                  selectedContainer
                    ? 'btn-primary hover:scale-[1.02]'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                Proximo
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
            <StepHeader
              onBack={handleBack}
              label={isVenda ? 'Compra de Container' : 'Aluguel de Container'}
            />

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

                {isMobile && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-3 rounded-button font-semibold btn-primary hover:scale-[1.02] transition-all duration-200"
                    >
                      Proximo
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 sticky top-24 shadow-glow animate-fade-up overflow-hidden">
                  <div className="mb-6">
                    <BudgetSummaryContent
                      selectedContainer={selectedContainer}
                      basePrice={basePrice}
                      selectedItems={selectedItems}
                      totalPrice={totalPrice}
                    />
                  </div>

                  <div className="border-t border-white/10" />
                  <div className="pt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Seus Dados</h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <ClientForm
                        register={register}
                        errors={errors}
                        setValue={setValue}
                        watch={watch}
                        onAddressInfoChange={setAddressInfo}
                      />
                      <button
                        type="submit"
                        disabled={!selectedContainer}
                        className={`w-full py-4 rounded-button font-semibold text-lg shadow-lg transition-all mt-5 ${
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
                    <QuoteActions
                      onDownloadPDF={handleDownloadPDF}
                      onWhatsApp={handleWhatsApp}
                      onEmail={handleEmail}
                      onViewDetails={handleViewDetails}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
            <StepHeader
              onBack={handleBack}
              label={isVenda ? 'Compra de Container' : 'Aluguel de Container'}
            />

            <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 mb-8 shadow-glow animate-fade-up">
              <BudgetSummaryContent
                selectedContainer={selectedContainer}
                basePrice={basePrice}
                selectedItems={selectedItems}
                totalPrice={totalPrice}
              />
            </div>

            <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 shadow-glow animate-fade-up">
              <h3 className="text-xl font-bold text-white mb-4">Seus Dados</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <ClientForm
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                  onAddressInfoChange={setAddressInfo}
                />
                <button
                  type="submit"
                  disabled={!selectedContainer}
                  className={`w-full py-4 rounded-button font-semibold text-lg shadow-lg transition-all mt-5 ${
                    selectedContainer
                      ? 'btn-primary-lg'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {selectedContainer ? 'Gerar Orcamento' : 'Selecione um Container'}
                </button>
              </form>

              {currentQuote && (
                <QuoteActions
                  onDownloadPDF={handleDownloadPDF}
                  onWhatsApp={handleWhatsApp}
                  onEmail={handleEmail}
                  onViewDetails={handleViewDetails}
                />
              )}
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

      {currentStep >= 2 && (
        <MobileBudgetBar
          selectedContainer={selectedContainer}
          basePrice={basePrice}
          selectedItems={selectedItems}
          totalPrice={totalPrice}
        />
      )}

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

const StepOperationChoice: React.FC<{ onChoose: (type: 'venda' | 'aluguel') => void }> = ({ onChoose }) => (
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
          onClick={() => onChoose('venda')}
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
          onClick={() => onChoose('aluguel')}
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
);

const StepHeader: React.FC<{ onBack: () => void; label: string }> = ({ onBack, label }) => (
  <div className="flex items-center gap-4 mb-8">
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 group"
    >
      <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-200" />
      <span className="text-sm font-medium">Voltar</span>
    </button>
    <div className="h-px flex-1 bg-white/10" />
    <span className="text-white/40 text-sm">{label}</span>
  </div>
);
