import React, { useState, useEffect } from 'react';
import { ChevronUp, X } from 'lucide-react';
import { Item } from '../types';
import { ContainerSize } from './ContainerSizeSelector';
import { BudgetSummaryContent } from './BudgetSummaryContent';
import { formatCurrency } from '../utils/formatters';

interface MobileBudgetBarProps {
  selectedContainer: ContainerSize | null;
  basePrice: number;
  selectedItems: Item[];
  totalPrice: number;
  onSimulate?: () => void;
}

export const MobileBudgetBar: React.FC<MobileBudgetBarProps> = ({
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
    <div className="lg:hidden">
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
          <div className="bg-[#060A13] border-t border-white/10 max-h-[70vh] overflow-y-auto">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors duration-200"
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
                  className="btn-primary w-full mt-4"
                >
                  Simular orçamento
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full h-16 bg-[#060A13] border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] px-5 flex items-center justify-between active:bg-white/5 transition-colors duration-150"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white/60 uppercase tracking-wide">Total</span>
            {itemCount > 0 && (
              <span className="text-[10px] font-medium text-alencar-green-light bg-alencar-green/20 px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">{formatCurrency(totalPrice)}</span>
            <ChevronUp
              size={18}
              className={`text-white/50 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
