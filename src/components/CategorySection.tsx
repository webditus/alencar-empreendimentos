import React from 'react';
import { Check } from 'lucide-react';
import { Category, Item } from '../types';
import { formatCurrency } from '../utils/formatters';
import { ImageThumbnail } from './ImageThumbnail';
import { itemImageService } from '../services/itemImageService';

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
    <div className="bg-gradient-to-br from-[#0a1f1a] to-[#0d2b25] border border-white/10 rounded-card shadow-xl p-6 mb-6 animate-fade-up">
      <h3 className="text-2xl font-bold text-white mb-4">{category.name}</h3>
      <div className="space-y-3">
        {category.items.map((item) => {
          const imageUrl = item.image_path ? itemImageService.getPublicUrl(item.image_path) : null;

          return (
            <label
              key={item.id}
              className={`relative flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                isSelected(item)
                  ? 'border-alencar-green bg-alencar-green/10 ring-1 ring-alencar-green/40'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {isSelected(item) && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-alencar-green text-white flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected(item)}
                  onChange={() => onItemToggle(item)}
                  className="w-5 h-5 text-alencar-green rounded focus:ring-alencar-green focus:ring-2 accent-alencar-green"
                />
                <div className={`transition-all duration-200 ${isSelected(item) ? 'text-alencar-green' : 'text-gray-400'}`}>
                  <ImageThumbnail imageUrl={imageUrl} altText={item.name} />
                </div>
                <span className="text-white font-medium">{item.name}</span>
              </div>
              <span className="text-alencar-green-light font-bold text-lg">
                {formatCurrency(item.price)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
