import React from 'react';
import { Category, Item } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CategorySectionProps {
  category: Category;
  selectedItems: Item[];
  onItemToggle: (item: Item) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  selectedItems,
  onItemToggle,
}) => {
  const isSelected = (item: Item) => selectedItems.some(selected => selected.id === item.id);

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-card shadow-xl p-6 mb-6 animate-fade-up">
      <h3 className="text-2xl font-bold text-alencar-dark mb-4">{category.name}</h3>
      <div className="space-y-3">
        {category.items.map((item) => (
          <label
            key={item.id}
            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
              isSelected(item)
                ? 'border-alencar-green bg-alencar-bg border-l-4'
                : 'border-gray-200 hover:border-alencar-green-light'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isSelected(item)}
                onChange={() => onItemToggle(item)}
                className="w-5 h-5 text-alencar-green rounded focus:ring-alencar-green focus:ring-2 accent-alencar-green"
              />
              <span className="text-gray-700 font-medium">{item.name}</span>
            </div>
            <span className="text-alencar-green font-bold text-lg">
              {formatCurrency(item.price)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
