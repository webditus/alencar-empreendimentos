import React from 'react';
import { ShoppingCart, Home } from 'lucide-react';
import { useOperation } from '../contexts/OperationContext';

export const PublicOperationToggle: React.FC = () => {
  const { setOperationType, isVenda, isLocacao } = useOperation();

  return (
    <div className="inline-flex items-center bg-white/10 rounded-full p-1 backdrop-blur-sm border border-white/10">
      <button
        onClick={() => setOperationType('venda')}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all duration-200 ${
          isVenda
            ? 'bg-white text-alencar-dark shadow-md'
            : 'text-white/70 hover:text-white'
        }`}
      >
        <ShoppingCart size={18} />
        Compra
      </button>

      <button
        onClick={() => setOperationType('locacao')}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all duration-200 ${
          isLocacao
            ? 'bg-white text-alencar-dark shadow-md'
            : 'text-white/70 hover:text-white'
        }`}
      >
        <Home size={18} />
        Locação
      </button>
    </div>
  );
};
