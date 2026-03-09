import React, { useState, useEffect } from 'react';
import { ContractTemplate, ContractType } from '../types/contract';
import { useContract } from '../contexts/ContractContext';
import { X, Save, Eye, Code } from 'lucide-react';
import SummernoteEditor from './SummernoteEditor';

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'compra-vista', label: 'Compra à Vista' },
  { value: 'compra-parcelada', label: 'Compra Parcelada' },
  { value: 'locacao', label: 'Locação' },
  { value: 'aditamento-locacao', label: 'Aditamento de Locação' }
];

interface ContractFormProps {
  contract?: ContractTemplate;
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
}

const ContractForm: React.FC<ContractFormProps> = ({
  contract,
  isOpen,
  onClose,
  mode
}) => {
  const { createContract, updateContract } = useContract();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'compra-vista' as ContractType,
    content: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (contract && mode === 'edit') {
        const newFormData = {
          name: contract.name || '',
          type: contract.type || 'compra-vista',
          content: contract.content || '',
          isActive: contract.isActive ?? true
        };
        
        console.log('ContractFormNew - Carregando dados para edição:', {
          contractId: contract.id,
          contractName: contract.name,
          contentLength: contract.content?.length || 0,
          contentPreview: contract.content?.substring(0, 100) + '...'
        });
        
        setFormData(newFormData);
      } else if (mode === 'create') {
        // Sempre limpar o estado ao criar novo contrato
        console.log('ContractFormNew - Criando novo contrato, limpando dados');
        setFormData({
          name: '',
          type: 'compra-vista',
          content: '',
          isActive: true
        });
      }
      setError(null);
      setShowPreview(false);
    }
  }, [contract, mode, isOpen]);

  // Efeito adicional para garantir limpeza no modo create
  useEffect(() => {
    if (mode === 'create' && !contract && isOpen) {
      console.log('ContractFormNew - Garantindo limpeza para modo create sem contrato');
      setFormData({
        name: '',
        type: 'compra-vista',
        content: '',
        isActive: true
      });
    }
  }, [contract, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        await createContract(formData);
      } else if (contract) {
        await updateContract(contract.id, formData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'compra-vista',
      content: '',
      isActive: true
    });
    setError(null);
    setShowPreview(false);
    onClose();
  };

  const insertVariable = (variable: string) => {
    if ((window as any).insertVariable) {
      (window as any).insertVariable(variable);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Criar Novo Contrato' : 'Editar Contrato'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Form */}
          <div className="w-80 p-6 border-r border-gray-200 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contrato
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Contrato
                </label>
                <select
                  id="type"
                  value={formData.type || 'compra-vista'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContractType }))}
                  className="input-base"
                  required
                >
                  {CONTRACT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-alencar-green focus:ring-alencar-green"
                  />
                  <span className="text-sm font-medium text-gray-700">Contrato Ativo</span>
                </label>
              </div>

              {/* Variáveis por Categoria */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Variáveis Disponíveis</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  
                  {/* Dados do Cliente */}
                  <div>
                    <h4 className="text-xs font-semibold text-alencar-green mb-1">DADOS DO CLIENTE</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {['CLIENTE_NOME', 'CLIENTE_NACIONALIDADE', 'CLIENTE_ESTADO_CIVIL', 'CLIENTE_PROFISSAO', 'CLIENTE_RG', 'CLIENTE_CPF', 'CLIENTE_ENDERECO', 'CLIENTE_ENDERECO_COMPLETO', 'CLIENTE_TELEFONE', 'CLIENTE_EMAIL'].map(variable => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-left px-2 py-1 text-xs bg-alencar-bg hover:bg-alencar-bg/80 rounded border text-alencar-green"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Container */}
                  <div>
                    <h4 className="text-xs font-semibold text-green-700 mb-1">CONTAINER</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {['CONTAINER_TIPO', 'CONTAINER_TAMANHO'].map(variable => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-left px-2 py-1 text-xs bg-green-50 hover:bg-green-100 rounded border text-green-700"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Valores Financeiros */}
                  <div>
                    <h4 className="text-xs font-semibold text-purple-700 mb-1">VALORES</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {['VALOR_TOTAL', 'VALOR_APROVADO', 'VALOR_ENTRADA', 'VALOR_PARCELA', 'NUMERO_PARCELAS'].map(variable => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-left px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 rounded border text-purple-700"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datas e Prazos */}
                  <div>
                    <h4 className="text-xs font-semibold text-orange-700 mb-1">DATAS E PRAZOS</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {['DATA_CONTRATO', 'DATA_ENTREGA', 'DIAS_UTEIS', 'ENDERECO_ENTREGA'].map(variable => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-left px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 rounded border text-orange-700"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Empresa */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">EMPRESA</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {['EMPRESA_NOME', 'EMPRESA_CNPJ', 'EMPRESA_ENDERECO'].map(variable => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-left px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded border text-gray-700"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>

          {/* Content Editor */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Editor de Contrato</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${
                      showPreview 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {showPreview ? <Code className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPreview ? 'Editor' : 'Preview'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4">
              {showPreview ? (
                <div 
                  className="w-full h-full border border-gray-300 rounded-lg p-4 overflow-y-auto prose max-w-none bg-white"
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />
              ) : (
                <SummernoteEditor
                  value={formData.content || ''}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  height={400}
                  placeholder="Digite o conteúdo do contrato aqui..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractForm;
