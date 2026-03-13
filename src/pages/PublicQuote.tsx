import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Package, RefreshCw, ArrowRight, Lightbulb } from 'lucide-react';
import { CategorySection } from '../components/CategorySection';
import { QuoteModal } from '../components/QuoteModal';
import { ContainerSizeSelector, ContainerSize } from '../components/ContainerSizeSelector';
import { BudgetSummaryContent } from '../components/BudgetSummaryContent';
import { BudgetBar } from '../components/BudgetBar';
import { StepIndicator } from '../components/StepIndicator';
import { ClientForm } from '../components/ClientForm';
import { QuoteActions } from '../components/QuoteActions';
import { Logo } from '../components/Logo';
import { useCategories } from '../contexts/CategoryContext';
import { useOperation } from '../contexts/OperationContext';
import { Customer, Item, QuoteItemSnapshot, Quote } from '../types';
import { generateWhatsAppLink, generateEmailLink } from '../utils/formatters';
import { generateQuotePDF } from '../services/pdfService';
import { useQuotes } from '../contexts/QuoteContext';

const STEP_LABELS = ['Operação', 'Container', 'Itens', 'Dados'];

export const PublicQuote: React.FC = () => {
  const { addQuote } = useQuotes();
  const { categories } = useCategories();
  const { operationType, setOperationType, isVenda } = useOperation();

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);

  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<ContainerSize | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressInfo, setAddressInfo] = useState({ city: '', state: '' });
  const [sidebarSubmitAttempted, setSidebarSubmitAttempted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Customer>();

  const totalSteps = 4;

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

  const handleOperationChoice = (type: 'venda' | 'locacao') => {
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

  const resolvePrice = (item: Item): number =>
    isVenda ? (item.vendaPrice ?? 0) : (item.locacaoPrice ?? 0);

  const totalPrice =
    (selectedContainer ? (isVenda ? selectedContainer.vendaPrice : selectedContainer.locacaoPrice) : 0) +
    selectedItems.reduce((sum, item) => sum + resolvePrice(item), 0);

  const basePrice = selectedContainer ? (isVenda ? selectedContainer.vendaPrice : selectedContainer.locacaoPrice) : 0;

  const createQuote = async (customerData: Customer): Promise<Quote | null> => {
    const itemSnapshots: QuoteItemSnapshot[] = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      price: resolvePrice(item),
      category: item.category,
      image_path: item.image_path,
    }));

    const quote: Quote = {
      id: Date.now().toString(),
      customer: {
        ...customerData,
        city: addressInfo.city,
        state: addressInfo.state,
      },
      selectedItems: itemSnapshots,
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

  const stepLabels = STEP_LABELS;

  return (
    <div className="min-h-screen bg-alencar-dark flex flex-col">
      <header className="bg-alencar-gradient border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 lg:py-0.5 flex items-center justify-between gap-4">
          <a href="/" aria-label="Ir para o inicio" className="flex-shrink-0">
            <Logo variant="horizontal-no-slogan" darkBackground={true} className="h-9 md:h-11 lg:h-6" />
          </a>
          <p className="text-white/70 text-sm md:text-base lg:text-xs text-right leading-snug">
            Simule seu container personalizado gratuitamente e sem compromisso.
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
          <div className="max-w-7xl mx-auto px-6 py-8 pb-28">
            <StepHeader
              onBack={handleBack}
              label={isVenda ? 'Compra de Container' : 'Locação de Container'}
            />
            <div className="mb-10">
              <ContainerSizeSelector
                selectedSize={selectedContainer}
                onSizeSelect={(container) => {
                  setSelectedContainer(container);
                  setTimeout(() => {
                    handleNext();
                  }, 200);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8 pb-28">
            <StepHeader
              onBack={handleBack}
              label={isVenda ? 'Compra de Container' : 'Locação de Container'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-8">
                <h3 className="text-2xl font-bold text-white mb-6">Selecione os itens desejados:</h3>
                {categories.map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    selectedItems={selectedItems}
                    onItemToggle={handleItemToggle}
                  />
                ))}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 rounded-button font-semibold btn-primary hover:scale-[1.02] transition-all duration-200"
                  >
                    Próximo
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              <div className="hidden lg:block lg:col-span-4">
                <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 sticky top-9">
                  <BudgetSummaryContent
                    selectedContainer={selectedContainer}
                    basePrice={basePrice}
                    selectedItems={selectedItems}
                    totalPrice={totalPrice}
                  />
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="btn-primary w-full mt-5"
                  >
                    Simular orçamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8 pb-28">
            <StepHeader
              onBack={handleBack}
              label={isVenda ? 'Compra de Container' : 'Locação de Container'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-8">
                <h3 className="text-2xl font-bold text-white mb-3">Informações para gerar seu orçamento</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  Preencha essas informações para gerar o PDF gratuito e sem compromisso. Esses dados são utilizados apenas para gerar o orçamento e não representam qualquer obrigação de compra.
                </p>

                <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
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
                    {selectedContainer ? 'Gerar meu orçamento' : 'Selecione um Container'}
                  </button>
                  <p className="text-xs text-white/40 text-center mt-2">Orçamento gratuito • Sem compromisso • Resposta rápida da equipe</p>
                </form>

                {currentQuote && (
                  <QuoteActions
                    onDownloadPDF={handleDownloadPDF}
                    onWhatsApp={handleWhatsApp}
                    onEmail={handleEmail}
                    onViewDetails={handleViewDetails}
                  />
                )}

                <div className="lg:hidden mt-8">
                  <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6">
                    <BudgetSummaryContent
                      selectedContainer={selectedContainer}
                      basePrice={basePrice}
                      selectedItems={selectedItems}
                      totalPrice={totalPrice}
                    />
                  </div>
                </div>
              </div>

              <div className="hidden lg:block lg:col-span-4">
                <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 sticky top-9">
                  <BudgetSummaryContent
                    selectedContainer={selectedContainer}
                    basePrice={basePrice}
                    selectedItems={selectedItems}
                    totalPrice={totalPrice}
                  />
                  <button
                    onClick={() => {
                      setSidebarSubmitAttempted(true);
                      formRef.current?.requestSubmit();
                    }}
                    disabled={!selectedContainer}
                    className={`w-full py-3 rounded-button font-semibold shadow-lg transition-all mt-5 ${
                      selectedContainer
                        ? 'btn-primary'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {selectedContainer ? 'Gerar meu orçamento' : 'Selecione um Container'}
                  </button>
                  {sidebarSubmitAttempted && Object.keys(errors).length > 0 && (
                    <p className="text-amber-400/80 text-xs text-center mt-2">
                      Preencha as informações para gerar o PDF gratuito e sem compromisso.
                    </p>
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
            Precisão, tecnologia e construção inteligente.
          </p>
        </div>
      </footer>

      {currentStep >= 2 && (
        <BudgetBar
          selectedContainer={selectedContainer}
          basePrice={basePrice}
          selectedItems={selectedItems}
          totalPrice={totalPrice}
          onSimulate={() => setCurrentStep(4)}
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

const StepOperationChoice: React.FC<{ onChoose: (type: 'venda' | 'locacao') => void }> = ({ onChoose }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
    <div className="w-full max-w-2xl text-center space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Como você deseja utilizar seu container?
        </h1>
        <p className="text-white/50 text-base">
          Escolha o modelo de aquisição para iniciar sua simulação de orçamento.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <button
          onClick={() => onChoose('venda')}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d2b25] to-[#1a4a3a] p-8 text-left transition-all duration-300 hover:border-[#2F855A] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(47,133,90,0.3)] max-w-[420px] mx-auto w-full min-h-[240px] flex flex-col justify-between"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-alencar-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-alencar-green/20 flex items-center justify-center group-hover:bg-alencar-green/30 transition-colors duration-300 flex-shrink-0">
                <Package size={32} className="text-alencar-green-light" />
              </div>
              <div>
                <span className="text-sm text-white/60">Simular a</span>
                <h2 className="text-2xl font-bold text-white">Compra</h2>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <p className="text-white/50 text-sm">Para quem deseja adquirir o container definitivamente.</p>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Investimento único</li>
                <li>• Personalização completa</li>
                <li>• Ideal para projetos permanentes</li>
              </ul>
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <span className="block w-full text-center py-2.5 rounded-lg border border-alencar-green/30 text-alencar-green-light text-sm font-semibold group-hover:bg-alencar-green/10 transition-colors duration-300">
              Simular compra
            </span>
          </div>
        </button>

        <button
          onClick={() => onChoose('locacao')}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d2b25] to-[#1a4a3a] p-8 text-left transition-all duration-300 hover:border-[#2F855A] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(47,133,90,0.3)] max-w-[420px] mx-auto w-full min-h-[240px] flex flex-col justify-between"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-alencar-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-alencar-green/20 flex items-center justify-center group-hover:bg-alencar-green/30 transition-colors duration-300 flex-shrink-0">
                <RefreshCw size={32} className="text-alencar-green-light" />
              </div>
              <div>
                <span className="text-sm text-white/60">Simular a</span>
                <h2 className="text-2xl font-bold text-white">Locação</h2>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <p className="text-white/50 text-sm">Para quem precisa de uma solução flexível.</p>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Pagamento mensal</li>
                <li>• Ideal para obras e eventos</li>
                <li>• Possibilidade de troca ou devolução</li>
              </ul>
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <span className="block w-full text-center py-2.5 rounded-lg border border-alencar-green/30 text-alencar-green-light text-sm font-semibold group-hover:bg-alencar-green/10 transition-colors duration-300">
              Simular locação
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
        <Lightbulb size={14} className="flex-shrink-0" />
        <span>Você poderá alterar essa escolha a qualquer momento durante a simulação.</span>
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
