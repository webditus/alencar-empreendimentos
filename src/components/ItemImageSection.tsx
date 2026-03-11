import React from 'react';
import { X, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';

interface ItemImageState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  showUpload: boolean;
  pendingFile: File | null;
  pendingPreviewUrl: string | null;
}

interface ItemImageSectionProps {
  itemId: string;
  itemName: string;
  imgState: ItemImageState;
  imageUrl: string | null;
  isDragOver: boolean;
  onOpenFilePicker: (itemId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDragLeave: (itemId: string) => void;
  onSave: (itemId: string) => void;
  onCancel: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onClearError: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => void;
  inputRef: (el: HTMLInputElement | null) => void;
}

export const ItemImageSection: React.FC<ItemImageSectionProps> = ({
  itemId,
  itemName,
  imgState,
  imageUrl,
  isDragOver,
  onOpenFilePicker,
  onDrop,
  onDragOver,
  onDragLeave,
  onSave,
  onCancel,
  onRemove,
  onClearError,
  onInputChange,
  inputRef,
}) => {
  return (
    <div className="px-3 pb-3 bg-gray-900/5 border-t border-gray-200">
      <div className="pt-3 max-w-xs space-y-3">
        {imgState.error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 flex-1">{imgState.error}</p>
            <button onClick={onClearError} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {imgState.pendingPreviewUrl ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img src={imgState.pendingPreviewUrl} alt="Pre-visualizacao" className="w-full h-full object-cover" />
              {imgState.isUploading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-xs">Enviando...</span>
                </div>
              )}
            </div>
            {imgState.isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-alencar-green h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${imgState.progress}%` }}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenFilePicker(itemId)}
                disabled={imgState.isUploading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Alterar imagem
              </button>
              <button
                type="button"
                onClick={() => onCancel(itemId)}
                disabled={imgState.isUploading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remover imagem
              </button>
              <button
                type="button"
                onClick={() => onSave(itemId)}
                disabled={imgState.isUploading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-alencar-green text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar imagem
              </button>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img src={imageUrl} alt={itemName} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenFilePicker(itemId)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Alterar imagem
              </button>
              <button
                type="button"
                onClick={() => onRemove(itemId)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
              >
                Remover imagem
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              onClick={() => onOpenFilePicker(itemId)}
              onDrop={(e) => onDrop(e, itemId)}
              onDragOver={(e) => onDragOver(e, itemId)}
              onDragLeave={() => onDragLeave(itemId)}
              className={`
                w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
                ${isDragOver
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              {isDragOver ? (
                <>
                  <UploadCloud size={28} className="text-green-600" />
                  <p className="text-sm font-medium text-green-700">Solte para adicionar</p>
                </>
              ) : (
                <>
                  <ImageIcon size={28} className="text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Nenhuma imagem definida</p>
                    <p className="text-gray-500 text-xs mt-0.5">Arraste uma imagem aqui ou clique no botão abaixo</p>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenFilePicker(itemId)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <UploadCloud size={16} />
              Adicionar imagem
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onInputChange(e, itemId)}
        />
      </div>
    </div>
  );
};
