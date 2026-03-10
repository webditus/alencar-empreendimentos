import React, { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  altText?: string;
  onReplace: () => void;
  onRemove: () => void;
  isLoading?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  altText = 'Imagem',
  onReplace,
  onRemove,
  isLoading = false,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative group w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
      {imgError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-sm">
          Falha ao carregar imagem
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={onReplace}
            className="flex items-center gap-1.5 bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-lg"
          >
            <RefreshCw size={14} />
            Substituir
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-lg"
          >
            <Trash2 size={14} />
            Remover
          </button>
        </div>
      )}
    </div>
  );
};
