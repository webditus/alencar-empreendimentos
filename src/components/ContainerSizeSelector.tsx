import React, { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { useOperation } from '../contexts/OperationContext';
import { containerImageService, ContainerImage } from '../services/containerImageService';

export interface ContainerSize {
  id: string;
  size: string;
  description: string;
  vendaPrice: number;
  aluguelPrice: number;
  image: string;
}

interface ContainerSizeSelectorProps {
  selectedSize: ContainerSize | null;
  onSizeSelect: (size: ContainerSize) => void;
}

const containerSizes: ContainerSize[] = [
  {
    id: '4m',
    size: '4 metros',
    description: 'Container compacto',
    vendaPrice: 45000,
    aluguelPrice: 750,
    image: ''
  },
  {
    id: '6m',
    size: '6 metros',
    description: 'Container medio',
    vendaPrice: 60000,
    aluguelPrice: 1000,
    image: ''
  },
  {
    id: '12m',
    size: '12 metros',
    description: 'Container grande',
    vendaPrice: 120000,
    aluguelPrice: 2500,
    image: ''
  }
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const ContainerPlaceholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full aspect-video bg-gradient-to-br from-alencar-dark to-alencar-green flex flex-col items-center justify-center gap-2">
    <Box className="w-10 h-10 text-white/40" />
    <span className="text-white/50 text-sm font-medium">{label}</span>
  </div>
);

export const ContainerSizeSelector: React.FC<ContainerSizeSelectorProps> = ({
  selectedSize,
  onSizeSelect
}) => {
  const { isVenda, isAluguel } = useOperation();
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    containerImageService.getAll().then((imgs: ContainerImage[]) => {
      const map: Record<string, string> = {};
      imgs.forEach((img) => {
        map[img.container_size_id] = img.image_url;
      });
      setImageMap(map);
    }).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-up">
      <h3 className="text-xl font-bold text-white mb-5 text-center">
        Escolha o tamanho do seu container:
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {containerSizes.map((container) => {
          const isSelected = selectedSize?.id === container.id;
          const currentPrice = isVenda ? container.vendaPrice : container.aluguelPrice;
          const priceLabel = isAluguel ? 'mensal' : '';
          const imgUrl = imageMap[container.id];

          return (
            <button
              key={container.id}
              onClick={() => onSizeSelect(container)}
              className={`relative overflow-hidden rounded-card bg-white transition-all duration-200 hover:scale-[1.03] hover:shadow-card-hover ${
                isSelected
                  ? 'ring-2 ring-alencar-green shadow-card-hover bg-alencar-bg'
                  : 'shadow-card hover:shadow-card-hover'
              }`}
            >
              <div className="aspect-video w-full overflow-hidden rounded-t-card">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={`Container ${container.size}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ContainerPlaceholder label={container.size} />
                )}
              </div>

              <div className="p-5 text-center">
                <h4 className="font-bold text-lg text-alencar-dark mb-1">
                  {container.size}
                </h4>
                <p className="text-gray-500 text-sm mb-3">
                  {container.description}
                </p>
                <div className={`text-2xl font-bold ${isSelected ? 'text-alencar-green' : 'text-gray-900'}`}>
                  {formatCurrency(currentPrice)}
                  {priceLabel && <span className="text-sm font-normal text-gray-500 ml-1">/{priceLabel}</span>}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-3 right-3 bg-alencar-green text-white rounded-full p-2 shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedSize && (
        <div className="mt-6 text-center p-4 bg-white/10 backdrop-blur-sm rounded-card border border-white/10">
          <p className="text-white/80 font-medium">
            Container selecionado: <strong className="text-white">{selectedSize.size}</strong>
          </p>
          <p className="text-alencar-green-light font-bold text-lg">
            Valor base: {formatCurrency(isVenda ? selectedSize.vendaPrice : selectedSize.aluguelPrice)}
            {isAluguel && ' mensal'}
          </p>
        </div>
      )}
    </div>
  );
};

export { containerSizes };
