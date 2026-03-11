import React, { createContext, useContext, useState } from 'react';
import { OperationType } from '../types';

interface OperationContextType {
  operationType: OperationType;
  setOperationType: (type: OperationType) => void;
  isVenda: boolean;
  isLocacao: boolean;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

export const useOperation = () => {
  const context = useContext(OperationContext);
  if (!context) {
    throw new Error('useOperation must be used within an OperationProvider');
  }
  return context;
};

export const OperationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operationType, setOperationType] = useState<OperationType>('venda');

  const isVenda = operationType === 'venda';
  const isLocacao = operationType === 'locacao';

  return (
    <OperationContext.Provider value={{ operationType, setOperationType, isVenda, isLocacao }}>
      {children}
    </OperationContext.Provider>
  );
};
