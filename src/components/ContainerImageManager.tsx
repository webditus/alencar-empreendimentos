import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import { containerImageService, ContainerImage } from '../services/containerImageService';

const CONTAINER_SIZES = [
  { id: '4m', label: '4 metros', description: 'Container compacto' },
  { id: '6m', label: '6 metros', description: 'Container medio' },
  { id: '12m', label: '12 metros', description: 'Container grande' },
];

export const ContainerImageManager: React.FC = () => {
  const [images, setImages] = useState<ContainerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await containerImageService.getAll();
      setImages(data);
    } catch (err) {
      console.error('Error loading container images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const getImageForSize = (sizeId: string): ContainerImage | undefined => {
    return images.find((img) => img.container_size_id === sizeId);
  };

  const handleFile = async (file: File, sizeId: string) => {
    if (!file.type.startsWith('image/')) return;

    try {
      setUploadingId(sizeId);
      setUploadProgress(0);

      await containerImageService.upload(file, sizeId, (percent) => {
        setUploadProgress(percent);
      });

      await loadImages();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent, sizeId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, sizeId);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, sizeId: string) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file, sizeId);
    e.target.value = '';
  };

  const handleDelete = async (sizeId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta imagem?')) return;

    try {
      await containerImageService.remove(sizeId);
      await loadImages();
    } catch (err) {
      console.error('Delete error:', err);
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
          const isUploading = uploadingId === size.id;
          const isDragOver = dragOverId === size.id;

          return (
            <div
              key={size.id}
              className="bg-white rounded-card border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">{size.label}</h4>
                <p className="text-xs text-gray-500">{size.description}</p>
              </div>

              {existing && !isUploading ? (
                <div className="relative group">
                  <img
                    src={existing.image_url}
                    alt={`Container ${size.label}`}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <label className="cursor-pointer bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-alencar-green" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileInput(e, size.id)}
                      />
                    </label>
                    <button
                      onClick={() => handleDelete(size.id)}
                      className="bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className={`block cursor-pointer aspect-video relative ${
                    isDragOver
                      ? 'bg-alencar-bg border-2 border-dashed border-alencar-green'
                      : 'bg-gray-50 border-2 border-dashed border-gray-200 hover:border-alencar-green-light hover:bg-alencar-bg/50'
                  } transition-all duration-200`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(size.id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleDrop(e, size.id)}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, size.id)}
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <RefreshCw className="w-8 h-8 text-alencar-green animate-spin mb-3" />
                      <div className="w-full max-w-[200px] bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-alencar-green to-alencar-green-light h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      {isDragOver ? (
                        <>
                          <X className="w-8 h-8 text-alencar-green mb-2" />
                          <span className="text-sm text-alencar-green font-medium">Solte aqui</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                          <span className="text-sm text-gray-400 text-center">
                            Arraste uma imagem ou clique para enviar
                          </span>
                          <span className="text-xs text-gray-300 mt-1">JPG, PNG ou WebP</span>
                        </>
                      )}
                    </div>
                  )}
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
