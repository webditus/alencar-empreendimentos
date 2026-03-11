import React, { useState } from 'react';
import { useContract } from '../contexts/ContractContext';
import { ContractTemplate } from '../types/contract';
import { Trash2, Pencil, Eye, Plus, ToggleLeft, ToggleRight, X } from 'lucide-react';
import ContractFormRefactor from './ContractFormRefactor';

const CONTRACT_TYPE_LABELS = {
  'compra-vista': 'Compra à Vista',
  'compra-parcelada': 'Compra Parcelada',
  'locacao': 'Locação',
  'aditamento-locacao': 'Aditamento de Locação'
};

const ContractManagementRefactor: React.FC = () => {
  const {
    contracts,
    loading,
    error,
    deleteContract,
    toggleContractStatus
  } = useContract();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    selectedContract: ContractTemplate | null;
  }>({
    isOpen: false,
    mode: 'create',
    selectedContract: null
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedContract: null
    });
  };

  const handleEdit = (contract: ContractTemplate) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      selectedContract: contract
    });
  };

  const handleView = (contract: ContractTemplate) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      selectedContract: contract
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      selectedContract: null
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContract(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleContractStatus(id, !currentStatus);
    } catch (error) {
      console.error('Erro ao alterar status do contrato:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-alencar-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Contratos</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie templates de contratos para diferentes tipos de operações
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Contrato
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato cadastrado</h3>
            <p className="text-sm text-gray-500 mb-6">
              Comece criando seu primeiro template de contrato para automatizar a geração de documentos.
            </p>
            <button
              onClick={handleCreate}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Contrato
            </button>
          </div>
        ) : (
          <table className="table-auto w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden xl:table-cell">
                  Criado em
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden xl:table-cell">
                  Atualizado em
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[280px]" title={contract.name}>
                      {contract.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 w-40">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                      {CONTRACT_TYPE_LABELS[contract.type]}
                    </span>
                  </td>
                  <td className="px-4 py-4 w-24">
                    <button
                      onClick={() => handleToggleStatus(contract.id, contract.isActive)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        contract.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {contract.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 w-28 text-sm text-gray-500 hidden xl:table-cell">
                    {formatDate(contract.createdAt)}
                  </td>
                  <td className="px-4 py-4 w-28 text-sm text-gray-500 hidden xl:table-cell">
                    {formatDate(contract.updatedAt)}
                  </td>
                  <td className="px-4 py-4 w-24 text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleView(contract)}
                        className="p-1.5 text-alencar-green hover:text-alencar-hover hover:bg-green-50 rounded-md transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(contract)}
                        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(contract.id)}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState.mode !== 'view' && (
        <ContractFormRefactor
          contract={modalState.selectedContract}
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          mode={modalState.mode}
        />
      )}

      {modalState.mode === 'view' && modalState.selectedContract && modalState.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalState.selectedContract.name}
                </h3>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {CONTRACT_TYPE_LABELS[modalState.selectedContract.type]}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: modalState.selectedContract.content || '<p>Sem conteúdo</p>' }}
              />
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => handleEdit(modalState.selectedContract!)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagementRefactor;
