import React, { createContext, useContext, useState, useEffect } from 'react';

export type OperationType = 'venda' | 'locacao';

interface OperationContextType {
  operationType: OperationType;
  setOperationType: (type: OperationType) => void;
  isVenda: boolean;
  isLocacao: boolean;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

export function OperationProvider({ children }: { children: React.ReactNode }) {
  const [operationType, setOperationType] = useState<OperationType>(() => {
    const saved = localStorage.getItem('operation-type');
    return (saved === 'venda' || saved === 'locacao') ? saved : 'venda';
  });

  useEffect(() => {
    localStorage.setItem('operation-type', operationType);
  }, [operationType]);

  const value: OperationContextType = {
    operationType,
    setOperationType,
    isVenda: operationType === 'venda',
    isLocacao: operationType === 'locacao'
  };

  return (
    <OperationContext.Provider value={value}>
      {children}
    </OperationContext.Provider>
  );
}

export function useOperation() {
  const context = useContext(OperationContext);
  if (context === undefined) {
    throw new Error('useOperation must be used within an OperationProvider');
  }
  return context;
}
