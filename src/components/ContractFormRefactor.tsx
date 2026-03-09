import React, { useState, useEffect, useRef } from 'react';
import { ContractTemplate, ContractType } from '../types/contract';
import { useContract } from '../contexts/ContractContext';
import { X, Save, Eye, Code } from 'lucide-react';
import SummernoteEditorRefactor from './SummernoteEditorRefactor';

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'compra-vista', label: 'Compra à Vista' },
  { value: 'compra-parcelada', label: 'Compra Parcelada' },
  { value: 'locacao', label: 'Locação' },
  { value: 'aditamento-locacao', label: 'Aditamento de Locação' }
];

// Variáveis disponíveis organizadas por categoria
const VARIABLES = {
  'Cliente': [
    'CLIENTE_NOME', 'CLIENTE_CPF', 'CLIENTE_RG', 'CLIENTE_ENDERECO',
    'CLIENTE_TELEFONE', 'CLIENTE_EMAIL', 'CLIENTE_PROFISSAO'
  ],
  'Empresa': [
    'EMPRESA_NOME', 'EMPRESA_CNPJ', 'EMPRESA_ENDERECO', 'EMPRESA_TELEFONE',
    'EMPRESA_EMAIL', 'EMPRESA_RESPONSAVEL'
  ],
  'Container': [
    'CONTAINER_TAMANHO', 'CONTAINER_TIPO', 'CONTAINER_COR', 'CONTAINER_NUMERO',
    'CONTAINER_ESPECIFICACOES'
  ],
  'Contrato': [
    'CONTRATO_NUMERO', 'CONTRATO_DATA', 'CONTRATO_VALOR', 'CONTRATO_PARCELAS',
    'CONTRATO_VENCIMENTO', 'CONTRATO_JUROS', 'CONTRATO_MULTA'
  ],
  'Entrega': [
    'ENTREGA_DATA', 'ENTREGA_ENDERECO', 'ENTREGA_PRAZO', 'ENTREGA_OBSERVACOES'
  ]
};

interface ContractFormProps {
  contract?: ContractTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  type: ContractType;
  content: string;
  isActive: boolean;
}

const ContractFormRefactor: React.FC<ContractFormProps> = ({
  contract,
  isOpen,
  onClose,
  mode
}) => {
  const { createContract, updateContract } = useContract();
  
  // Estados
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'compra-vista',
    content: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Refs para controle
  const isInitializedRef = useRef(false);
  const editorId = useRef(`contract-editor-${Math.random().toString(36).substr(2, 9)}`);

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'compra-vista',
      content: '',
      isActive: true
    });
    setError(null);
    setShowPreview(false);
    isInitializedRef.current = false;
  };

  // Inicializar dados quando modal abre
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      if (contract && mode === 'edit') {
        setFormData({
          name: contract.name || '',
          type: contract.type || 'compra-vista',
          content: contract.content || '',
          isActive: contract.isActive ?? true
        });
      } else if (mode === 'create') {
        resetForm();
      }
      isInitializedRef.current = true;
      setError(null);
      setShowPreview(false);
    }
  }, [isOpen, contract, mode]);

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome do contrato é obrigatório');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Conteúdo do contrato é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        await createContract(formData);
      } else if (contract) {
        await updateContract(contract.id, formData);
      }
      
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contrato');
    } finally {
      setLoading(false);
    }
  };

  // Fechar modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Inserir variável
  const insertVariable = (variable: string) => {
    const insertFn = (window as any)[`insertVariable_${editorId.current}`] || (window as any).insertVariable;
    if (insertFn) {
      insertFn(variable);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Criar Novo Contrato' : 'Editar Contrato'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar - Form */}
          <div className="w-80 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nome */}
              <div>
                <label htmlFor="contract-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contrato *
                </label>
                <input
                  type="text"
                  id="contract-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                  required
                  disabled={loading}
                />
              </div>

              {/* Tipo */}
              <div>
                <label htmlFor="contract-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Contrato *
                </label>
                <select
                  id="contract-type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContractType }))}
                  className="input-base"
                  required
                  disabled={loading}
                >
                  {CONTRACT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contract-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-alencar-green focus:ring-alencar-green border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="contract-active" className="ml-2 block text-sm text-gray-700">
                  Contrato Ativo
                </label>
              </div>
            </form>

            {/* Variáveis */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Variáveis Disponíveis</h3>
              <div className="space-y-3">
                {Object.entries(VARIABLES).map(([category, variables]) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {variables.map(variable => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-left px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          disabled={loading}
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            
            {/* Editor Controls */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    !showPreview
                      ? 'bg-alencar-green text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={loading}
                >
                  <Code className="w-4 h-4 inline mr-1" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    showPreview
                      ? 'bg-alencar-green text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={loading}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Preview
                </button>
              </div>
            </div>

            {/* Editor/Preview Content */}
            <div className="flex-1 p-4 bg-white overflow-hidden">
              {showPreview ? (
                <div 
                  className="w-full h-full border border-gray-300 rounded-lg p-4 overflow-y-auto prose max-w-none bg-white"
                  dangerouslySetInnerHTML={{ __html: formData.content || '<p>Nenhum conteúdo para visualizar...</p>' }}
                />
              ) : (
                <div className="h-full">
                  <SummernoteEditorRefactor
                    id={editorId.current}
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    height={400}
                    placeholder="Digite o conteúdo do contrato aqui. Use as variáveis da barra lateral para personalizar o documento."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim() || !formData.content.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === 'create' ? 'Criar Contrato' : 'Salvar Alterações'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractFormRefactor;
