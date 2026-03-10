import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import { containerImageService, ContainerImage } from '../services/containerImageService';
import { ImageUpload } from './ImageUpload';

const CONTAINER_SIZES = [
  { id: '4m', label: '4 metros', description: 'Container compacto' },
  { id: '6m', label: '6 metros', description: 'Container medio' },
  { id: '12m', label: '12 metros', description: 'Container grande' },
];

interface SizeState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const defaultSizeState = (): SizeState => ({
  isUploading: false,
  progress: 0,
  error: null,
});

export const ContainerImageManager: React.FC = () => {
  const [images, setImages] = useState<ContainerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizeStates, setSizeStates] = useState<Record<string, SizeState>>({
    '4m': defaultSizeState(),
    '6m': defaultSizeState(),
    '12m': defaultSizeState(),
  });

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await containerImageService.getAll();
      setImages(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const getImageForSize = (sizeId: string): ContainerImage | undefined =>
    images.find((img) => img.container_size_id === sizeId);

  const updateSizeState = (sizeId: string, patch: Partial<SizeState>) => {
    setSizeStates((prev) => ({
      ...prev,
      [sizeId]: { ...prev[sizeId], ...patch },
    }));
  };

  const handleFileSelected = async (file: File, sizeId: string) => {
    updateSizeState(sizeId, { isUploading: true, progress: 0, error: null });
    try {
      await containerImageService.upload(file, sizeId, (percent) => {
        updateSizeState(sizeId, { progress: percent });
      });
      await loadImages();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar imagem. Tente novamente.';
      updateSizeState(sizeId, { error: message });
    } finally {
      updateSizeState(sizeId, { isUploading: false, progress: 0 });
    }
  };

  const handleRemove = async (sizeId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta imagem?')) return;
    updateSizeState(sizeId, { error: null });
    try {
      await containerImageService.remove(sizeId);
      await loadImages();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao remover imagem. Tente novamente.';
      updateSizeState(sizeId, { error: message });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <RefreshCw className="w-6 h-6 text-alencar-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Imagens dos Containers</h3>
          <p className="text-sm text-gray-500 mt-1">
            Arraste ou clique para enviar fotos de cada tamanho de container
          </p>
        </div>
        <button
          onClick={loadImages}
          className="text-gray-400 hover:text-alencar-green transition-colors"
          title="Recarregar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CONTAINER_SIZES.map((size) => {
          const existing = getImageForSize(size.id);
          const state = sizeStates[size.id];

          return (
            <div
              key={size.id}
              className="bg-white rounded-card border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">{size.label}</h4>
                <p className="text-xs text-gray-500">{size.description}</p>
              </div>

              <div className="p-4 bg-white">
                {state.error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 flex-1">{state.error}</p>
                    <button
                      onClick={() => updateSizeState(size.id, { error: null })}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <ImageUpload
                  currentImageUrl={existing?.image_url ?? null}
                  label="Arraste ou clique para enviar"
                  isUploading={state.isUploading}
                  uploadProgress={state.progress}
                  onFileSelected={(file) => handleFileSelected(file, size.id)}
                  onRemove={() => handleRemove(size.id)}
                  disabled={state.isUploading}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
