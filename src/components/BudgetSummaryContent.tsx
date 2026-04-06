import React from 'react';
import { Item } from '../types';
import { ContainerSize } from './ContainerSizeSelector';
import { formatCurrency } from '../utils/formatters';
import { useOperation } from '../contexts/OperationContext';

interface BudgetSummaryContentProps {
  selectedContainer: ContainerSize | null;
  basePrice: number;
  selectedItems: Item[];
  totalPrice: number;
}

export const BudgetSummaryContent: React.FC<BudgetSummaryContentProps> = ({
  selectedContainer,
  basePrice,
  selectedItems,
  totalPrice,
}) => {
  const { isVenda } = useOperation();

  const resolvePrice = (item: Item): number =>
    isVenda ? (item.vendaPrice ?? 0) : (item.locacaoPrice ?? 0);

  return (
    <>
      <h3 className="text-xl font-bold text-[#060A13] mb-4">Simulação do seu projeto</h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-[#245247]">Container base:</span>
          <span className="font-semibold text-[#060A13]">
            {selectedContainer ? formatCurrency(basePrice) : 'R$ 0,00'}
          </span>
        </div>
        {selectedItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-[#245247]">{item.name}:</span>
            <span className="font-semibold text-[#060A13]">{formatCurrency(resolvePrice(item))}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#245247]/30 pt-3">
        <div className="flex justify-between items-end">
          <span className="text-xs uppercase tracking-wide text-[#245247]">Total:</span>
          <span className="text-xl font-bold text-[#060A13]">{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </>
  );
};
