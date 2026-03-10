import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X, AlertCircle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { containerImageService, ContainerImage } from '../services/containerImageService';
import { validateImageFile } from '../utils/imageUtils';

const CONTAINER_SIZES = [
  { id: '4m', label: 'Container 4 metros', description: 'Container compacto' },
  { id: '6m', label: 'Container 6 metros', description: 'Container médio' },
  { id: '12m', label: 'Container 12 metros', description: 'Container grande' },
];

interface SizeState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  pendingFile: File | null;
  pendingPreviewUrl: string | null;
}

const defaultSizeState = (): SizeState => ({
  isUploading: false,
  progress: 0,
  error: null,
  pendingFile: null,
  pendingPreviewUrl: null,
});

export const ContainerImageManager: React.FC = () => {
  const [images, setImages] = useState<ContainerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizeStates, setSizeStates] = useState<Record<string, SizeState>>({
    '4m': defaultSizeState(),
    '6m': defaultSizeState(),
    '12m': defaultSizeState(),
  });
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragOver, setDragOver] = useState<Record<string, boolean>>({});

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await containerImageService.getAll();
      setImages(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    return () => {
      Object.values(sizeStates).forEach((s) => {
        if (s.pendingPreviewUrl) URL.revokeObjectURL(s.pendingPreviewUrl);
      });
    };
  }, []);

  const getImageForSize = (sizeId: string): ContainerImage | undefined =>
    images.find((img) => img.container_size_id === sizeId);

  const updateSizeState = (sizeId: string, patch: Partial<SizeState>) => {
    setSizeStates((prev) => ({
      ...prev,
      [sizeId]: { ...prev[sizeId], ...patch },
    }));
  };

  const handleFileSelected = (file: File, sizeId: string) => {
    const state = sizeStates[sizeId];
    if (state.pendingPreviewUrl) URL.revokeObjectURL(state.pendingPreviewUrl);

    const validationError = validateImageFile(file);
    if (validationError) {
      updateSizeState(sizeId, { error: validationError.message });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    updateSizeState(sizeId, {
      pendingFile: file,
      pendingPreviewUrl: previewUrl,
      error: null,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, sizeId: string) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file, sizeId);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, sizeId: string) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [sizeId]: false }));
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file, sizeId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, sizeId: string) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [sizeId]: true }));
  };

  const handleDragLeave = (sizeId: string) => {
    setDragOver((prev) => ({ ...prev, [sizeId]: false }));
  };

  const openFilePicker = (sizeId: string) => {
    inputRefs.current[sizeId]?.click();
  };

  const handleCancelPending = (sizeId: string) => {
    const state = sizeStates[sizeId];
    if (state.pendingPreviewUrl) URL.revokeObjectURL(state.pendingPreviewUrl);
    updateSizeState(sizeId, { pendingFile: null, pendingPreviewUrl: null, error: null });
  };

  const handleSave = async (sizeId: string) => {
    const state = sizeStates[sizeId];
    if (!state.pendingFile) return;

    updateSizeState(sizeId, { isUploading: true, progress: 0, error: null });
    try {
      await containerImageService.upload(state.pendingFile, sizeId, (percent) => {
        updateSizeState(sizeId, { progress: percent });
      });
      if (state.pendingPreviewUrl) URL.revokeObjectURL(state.pendingPreviewUrl);
      updateSizeState(sizeId, { pendingFile: null, pendingPreviewUrl: null });
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
    const state = sizeStates[sizeId];
    if (state.pendingPreviewUrl) URL.revokeObjectURL(state.pendingPreviewUrl);
    updateSizeState(sizeId, { pendingFile: null, pendingPreviewUrl: null, error: null });

    const existing = getImageForSize(sizeId);
    if (!existing) return;

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
            Gerencie as fotos exibidas para cada tamanho de container
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
          const isDragging = !!dragOver[size.id];
          const hasSaved = !!existing;
          const hasPending = !!state.pendingPreviewUrl;
          const isDisabled = state.isUploading;

          return (
            <div
              key={size.id}
              className="bg-white rounded-card border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">{size.label}</h4>
                <p className="text-xs text-gray-500">{size.description}</p>
              </div>

              <div className="p-4 space-y-3">
                {state.error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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

                {hasPending ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={state.pendingPreviewUrl!}
                        alt="Pré-visualização"
                        className="w-full h-full object-cover"
                      />
                      {state.isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-white text-xs">Enviando...</span>
                        </div>
                      )}
                    </div>
                    {state.isUploading && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-alencar-green h-1.5 rounded-full transition-all duration-200"
                          style={{ width: `${state.progress}%` }}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openFilePicker(size.id)}
                        disabled={isDisabled}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Alterar imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelPending(size.id)}
                        disabled={isDisabled}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remover imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(size.id)}
                        disabled={isDisabled}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-alencar-green text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Salvar imagem
                      </button>
                    </div>
                  </div>
                ) : hasSaved ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={existing.image_url}
                        alt={size.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openFilePicker(size.id)}
                        disabled={isDisabled}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Alterar imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(size.id)}
                        disabled={isDisabled}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remover imagem
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() => !isDisabled && openFilePicker(size.id)}
                      onDrop={(e) => handleDrop(e, size.id)}
                      onDragOver={(e) => handleDragOver(e, size.id)}
                      onDragLeave={() => handleDragLeave(size.id)}
                      className={`
                        w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
                        ${isDragging
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {isDragging ? (
                        <>
                          <UploadCloud size={28} className="text-green-600" />
                          <p className="text-sm font-medium text-green-700">Solte para adicionar</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={28} className="text-gray-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                              Nenhuma imagem definida
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              Arraste uma imagem aqui ou clique no botão abaixo
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openFilePicker(size.id)}
                      disabled={isDisabled}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UploadCloud size={16} />
                      Adicionar imagem
                    </button>
                  </div>
                )}

                <input
                  ref={(el) => { inputRefs.current[size.id] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleInputChange(e, size.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
