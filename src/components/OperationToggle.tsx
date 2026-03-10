import { useOperation } from '../contexts/OperationContext';
import { ShoppingCart, Home } from 'lucide-react';

interface OperationToggleProps {
  collapsed?: boolean;
}

export function OperationToggle({ collapsed = false }: OperationToggleProps) {
  const { setOperationType, isVenda, isAluguel } = useOperation();

  return (
    <div className={`flex items-center bg-white/10 rounded-full p-1 border border-white/10 max-w-full ${collapsed ? 'justify-center' : ''}`}>
      <button
        onClick={() => setOperationType('venda')}
        title={collapsed ? 'Venda' : undefined}
        className={`flex items-center justify-center rounded-full transition-all duration-200 text-sm font-medium ${
          collapsed ? 'p-2' : 'px-4 py-2'
        } ${
          isVenda
            ? 'bg-alencar-green text-white shadow-md'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <ShoppingCart className={`w-4 h-4 flex-shrink-0 ${collapsed ? '' : 'mr-2'}`} />
        {!collapsed && 'Venda'}
      </button>

      <button
        onClick={() => setOperationType('aluguel')}
        title={collapsed ? 'Aluguel' : undefined}
        className={`flex items-center justify-center rounded-full transition-all duration-200 text-sm font-medium ${
          collapsed ? 'p-2' : 'px-4 py-2'
        } ${
          isAluguel
            ? 'bg-alencar-green-light text-white shadow-md'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <Home className={`w-4 h-4 flex-shrink-0 ${collapsed ? '' : 'mr-2'}`} />
        {!collapsed && 'Aluguel'}
      </button>
    </div>
  );
}
