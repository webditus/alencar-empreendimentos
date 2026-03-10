import React, { useState, useEffect } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { useAuth } from '../../contexts/AuthContext';
import { ContractSigningService } from '../../services/contractSigningService';
import { ContractTemplate } from '../../types/contract';
import { ContractVariable, ContractGenerationData } from '../../types/contractSigning';
import { X, FileText, Users, PenTool, Send } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';

interface ContractGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  quoteData?: {
    clientName?: string;
    clientEmail?: string;
    containerSize?: string;
    operationType?: string;
    totalValue?: number;
  };
  onContractGenerated?: (contract: any) => void;
}

const ContractGenerationModal: React.FC<ContractGenerationModalProps> = ({
  isOpen,
  onClose,
  quoteId,
  quoteData,
  onContractGenerated
}) => {
  const { contracts } = useContract();
  const { user } = useAuth();
  
  // Estados do modal
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do formulário
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [signatories, setSignatories] = useState<Array<{name: string; email: string; isCreator?: boolean}>>([]);
  const [creatorSignature, setCreatorSignature] = useState<string | null>(null);
  const [parsedVariables, setParsedVariables] = useState<ContractVariable[]>([]);

  // Inicializar dados quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      // Reset do formulário
      setCurrentStep(1);
      setError(null);
      setSelectedTemplate(null);
      setContractTitle('');
      setVariables({});
      setCreatorSignature(null);
      
      // Inicializar signatários com o usuário atual
      setSignatories([
        {
          name: user.email?.split('@')[0] || user.email,
          email: user.email,
          isCreator: true
        }
      ]);

      // Se temos dados do orçamento, pré-preencher alguns campos
      if (quoteData) {
        setVariables({
          CLIENTE_NOME: quoteData.clientName || '',
          CLIENTE_EMAIL: quoteData.clientEmail || '',
          CONTAINER_TAMANHO: quoteData.containerSize || '',
          CONTRATO_VALOR: quoteData.totalValue?.toString() || '',
          CONTRATO_DATA: new Date().toLocaleDateString('pt-BR')
        });
      }
    }
  }, [isOpen, user, quoteData]);

  // Parse das variáveis quando template é selecionado
  useEffect(() => {
    if (selectedTemplate?.content) {
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const foundVariables = new Set<string>();
      let match;

      while ((match = variableRegex.exec(selectedTemplate.content)) !== null) {
        foundVariables.add(match[1].trim());
      }

      const parsedVars: ContractVariable[] = Array.from(foundVariables).map(name => ({
        name,
        label: name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        type: name.includes('EMAIL') ? 'email' : 
              name.includes('DATA') ? 'date' : 
              name.includes('VALOR') || name.includes('PRECO') ? 'number' : 'text',
        required: true,
        placeholder: `Digite ${name.replace(/_/g, ' ').toLowerCase()}`,
        value: variables[name] || ''
      }));

      setParsedVariables(parsedVars);
    }
  }, [selectedTemplate, variables]);

  // Validações
  const canProceedToStep2 = selectedTemplate && contractTitle.trim();
  const canProceedToStep3 = parsedVariables.every(v => !v.required || variables[v.name]?.trim());
  const canProceedToStep4 = signatories.length >= 1 && signatories.every(s => s.name.trim() && s.email.trim());
  const canGenerate = creatorSignature && currentStep === 4;

  // Handlers
  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setContractTitle(`${template.name} - ${quoteData?.clientName || 'Cliente'}`);
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSignatory = () => {
    setSignatories(prev => [...prev, { name: '', email: '' }]);
  };

  const handleRemoveSignatory = (index: number) => {
    if (index === 0) return; // Não pode remover o criador
    setSignatories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignatoryChange = (index: number, field: 'name' | 'email', value: string) => {
    setSignatories(prev => 
      prev.map((s, i) => i === index ? { ...s, [field]: value } : s)
    );
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !creatorSignature || !user) return;

    setLoading(true);
    setError(null);

    try {
      const generationData: ContractGenerationData = {
        templateId: selectedTemplate.id,
        title: contractTitle,
        variables,
        signatories,
        creatorSignature
      };

      const contract = await ContractSigningService.generateContract(
        quoteId,
        generationData,
        user.id
      );

      // Mostrar link gerado
      alert(`Contrato gerado com sucesso!\nLink: ${window.location.origin}/sign/${contract.signingLink}`);
      
      // Chamar callback se fornecido
      if (onContractGenerated) {
        onContractGenerated(contract);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar contrato');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Selecionar Template', icon: FileText },
    { number: 2, title: 'Preencher Variáveis', icon: FileText },
    { number: 3, title: 'Definir Signatários', icon: Users },
    { number: 4, title: 'Sua Assinatura', icon: PenTool }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gerar Contrato</h2>
            <p className="text-sm text-gray-600 mt-1">
              Criar contrato para assinatura digital
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-alencar-green border-alencar-green text-white'
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 ml-4 ${
                    currentStep > step.number ? 'bg-alencar-green' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600 text-center">
            Etapa {currentStep}: {steps[currentStep - 1]?.title}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Selecionar Template de Contrato</h3>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {contracts.filter(c => c.isActive).map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-alencar-green bg-alencar-bg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Tipo: {template.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Contrato
                  </label>
                  <input
                    type="text"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    className="input-base w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: Contrato de Locação - João Silva"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Variables */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Preencher Variáveis do Contrato</h3>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {parsedVariables.map(variable => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.label} {variable.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={variable.type}
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="input-base w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={variable.placeholder}
                      required={variable.required}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Signatories */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Definir Signatários</h3>
                <button
                  onClick={handleAddSignatory}
                  className="btn-primary px-3 py-2 text-sm rounded-lg"
                >
                  Adicionar Signatário
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {signatories.map((signatory, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {index === 0 ? 'Você (Criador)' : `Signatário ${index + 1}`}
                      </span>
                      {index > 0 && (
                        <button
                          onClick={() => handleRemoveSignatory(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={signatory.name}
                        onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)}
                        className="input-base px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Nome completo"
                        disabled={index === 0}
                      />
                      <input
                        type="email"
                        value={signatory.email}
                        onChange={(e) => handleSignatoryChange(index, 'email', e.target.value)}
                        className="input-base px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="E-mail"
                        disabled={index === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Creator Signature */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Sua Assinatura Digital</h3>
              <p className="text-sm text-gray-600">
                Como criador do contrato, você deve assinar primeiro. Apenas após sua assinatura, 
                o link será gerado para os demais signatários.
              </p>
              
              <SignatureCanvas
                width={500}
                height={200}
                onSignatureChange={setCreatorSignature}
                className="mx-auto"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={currentStep === 1 || loading}
          >
            Voltar
          </button>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !canProceedToStep2) ||
                  (currentStep === 2 && !canProceedToStep3) ||
                  (currentStep === 3 && !canProceedToStep4) ||
                  loading
                }
                className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gerar Contrato
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractGenerationModal;
