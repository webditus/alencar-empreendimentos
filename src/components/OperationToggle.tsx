import { useOperation } from '../contexts/OperationContext';
import { ShoppingCart, Home } from 'lucide-react';

export function OperationToggle() {
  const { setOperationType, isVenda, isAluguel } = useOperation();

  return (
    <div className="flex items-center bg-white/10 rounded-full p-1 border border-white/10">
      <button
        onClick={() => setOperationType('venda')}
        className={`flex items-center px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
          isVenda
            ? 'bg-alencar-green text-white shadow-md'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Venda
      </button>

      <button
        onClick={() => setOperationType('aluguel')}
        className={`flex items-center px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
          isAluguel
            ? 'bg-alencar-green-light text-white shadow-md'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Home className="w-4 h-4 mr-2" />
        Aluguel
      </button>
    </div>
  );
}
