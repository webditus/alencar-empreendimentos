import React, { useState, useEffect } from 'react';
import { ChevronUp, X } from 'lucide-react';
import { Item } from '../types';
import { ContainerSize } from './ContainerSizeSelector';
import { BudgetSummaryContent } from './BudgetSummaryContent';
import { formatCurrency } from '../utils/formatters';

interface BudgetBarProps {
  selectedContainer: ContainerSize | null;
  basePrice: number;
  selectedItems: Item[];
  totalPrice: number;
  onSimulate?: () => void;
}

export const BudgetBar: React.FC<BudgetBarProps> = ({
  selectedContainer,
  basePrice,
  selectedItems,
  totalPrice,
  onSimulate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const itemCount = selectedItems.length + (selectedContainer ? 1 : 0);

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[70vh]' : 'max-h-0'
          }`}
        >
          <div className="bg-[#b6ff28] border-t border-[#a3e824] max-h-[70vh] overflow-y-auto">
            <div className="px-5 pt-5 pb-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#245247]/20 text-[#245247] hover:bg-[#245247]/30 hover:text-[#060A13] transition-colors duration-200"
                >
                  <X size={16} />
                </button>
              </div>
              <BudgetSummaryContent
                selectedContainer={selectedContainer}
                basePrice={basePrice}
                selectedItems={selectedItems}
                totalPrice={totalPrice}
              />
              {onSimulate && (
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    onSimulate();
                  }}
                  className="w-full mt-4 h-11 bg-[#060A13] text-[#b6ff28] font-semibold text-sm rounded-lg hover:bg-[#0f1a2e] active:bg-[#060A13] transition-colors duration-150"
                >
                  Simular orçamento
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full h-16 bg-[#b6ff28] border-t border-[#a3e824] shadow-[0_-4px_20px_rgba(0,0,0,0.4)] px-5 flex items-center justify-between active:bg-[#a3e824] transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#245247] uppercase tracking-wide">Total</span>
            <span className="text-lg font-bold text-[#060A13]">{formatCurrency(totalPrice)}</span>
            {itemCount > 0 && (
              <span className="text-[10px] font-medium text-[#060A13] bg-[#245247]/20 px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#245247]">
              {isExpanded ? 'Fechar' : 'Expandir'}
            </span>
            <ChevronUp
              size={18}
              className={`text-[#245247] transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </div>
    </>
  );
};
