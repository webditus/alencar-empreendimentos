import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { ImagePreview } from './ImagePreview';
import { validateImageFile } from '../utils/imageUtils';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  label?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  label = 'Clique ou arraste uma imagem aqui',
  isUploading = false,
  uploadProgress = 0,
  error,
  onFileSelected,
  onRemove,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;

  const handleFile = useCallback((file: File) => {
    setLocalError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setLocalError(validationError.message);
      return;
    }
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const openFilePicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  if (currentImageUrl) {
    return (
      <div className="space-y-2">
        <ImagePreview
          imageUrl={currentImageUrl}
          onReplace={openFilePicker}
          onRemove={onRemove}
          isLoading={isUploading}
        />
        {isUploading && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-alencar-green h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        {displayError && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs">
            <AlertCircle size={12} />
            {displayError}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
          ${isDragOver
            ? 'border-alencar-green bg-alencar-green/10'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-alencar-green border-t-transparent rounded-full animate-spin" />
            <span className="text-white/60 text-sm">Enviando...</span>
          </div>
        ) : (
          <>
            <UploadCloud size={28} className={isDragOver ? 'text-alencar-green' : 'text-white/40'} />
            <div className="text-center">
              <p className={`text-sm font-medium ${isDragOver ? 'text-alencar-green' : 'text-white/60'}`}>
                {label}
              </p>
              <p className="text-white/30 text-xs mt-0.5">JPG, PNG ou WEBP · Máx. 10MB</p>
            </div>
          </>
        )}
      </div>

      {isUploading && (
        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-alencar-green h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle size={12} />
          {displayError}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
};
