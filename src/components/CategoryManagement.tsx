import React, { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Package, DollarSign, Eye, EyeOff, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import { useOperation } from '../contexts/OperationContext';
import { formatCurrency } from '../utils/formatters';
import { ContainerImageManager } from './ContainerImageManager';
import { itemImageService } from '../services/itemImageService';
import { validateImageFile } from '../utils/imageUtils';

interface ItemImageState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  showUpload: boolean;
  pendingFile: File | null;
  pendingPreviewUrl: string | null;
}

export const CategoryManagement: React.FC = () => {
  const {
    adminCategories: categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    addItemToCategory,
    updateItem,
    deleteItem,
    toggleItemStatus,
    refreshCategories,
  } = useCategories();

  const { operationType, isVenda, isLocacao } = useOperation();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; itemId: string } | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newItem, setNewItem] = useState<{ categoryId: string; name: string; price: string }>({
    categoryId: '',
    name: '',
    price: ''
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [itemImageStates, setItemImageStates] = useState<Record<string, ItemImageState>>({});
  const itemInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFilesRef = useRef<Record<string, File | null>>({});
  const pendingPreviewUrlsRef = useRef<Record<string, string | null>>({});
  const [itemDragOver, setItemDragOver] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => {
      Object.values(pendingPreviewUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const defaultItemImageState: ItemImageState = { isUploading: false, progress: 0, error: null, showUpload: false, pendingFile: null, pendingPreviewUrl: null };

  const getItemImageState = (itemId: string): ItemImageState =>
    itemImageStates[itemId] ?? defaultItemImageState;

  const updateItemImageState = (itemId: string, patch: Partial<ItemImageState>) => {
    setItemImageStates((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? defaultItemImageState), ...patch },
    }));
  };

  const handleAddCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        await addCategory(newCategory.name.trim(), operationType);
        setNewCategory({ name: '' });
        setShowAddCategory(false);
      } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
      }
    }
  };

  const handleAddItem = async (categoryId: string) => {
    if (newItem.name.trim() && newItem.price.trim()) {
      try {
        await addItemToCategory(categoryId, newItem.name.trim(), parseFloat(newItem.price));
        setNewItem({ categoryId: '', name: '', price: '' });
        setShowAddItem(null);
      } catch (error) {
        console.error('Erro ao adicionar item:', error);
      }
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    if (name.trim()) {
      try {
        await updateCategory(categoryId, name.trim());
        setEditingCategory(null);
      } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
      }
    }
  };

  const handleUpdateItem = async (itemId: string, name: string, price: string) => {
    if (name.trim() && price.trim()) {
      try {
        await updateItem(itemId, name.trim(), parseFloat(price));
        setEditingItem(null);
      } catch (error) {
        console.error('Erro ao atualizar item:', error);
      }
    }
  };

  const handleToggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      await toggleCategoryStatus(categoryId, !currentStatus);
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error);
    }
  };

  const handleToggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      await toggleItemStatus(itemId, !currentStatus);
    } catch (error) {
      console.error('Erro ao alterar status do item:', error);
    }
  };

  const handleItemFileSelected = (file: File, itemId: string) => {
    if (pendingPreviewUrlsRef.current[itemId]) {
      URL.revokeObjectURL(pendingPreviewUrlsRef.current[itemId]!);
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      pendingFilesRef.current[itemId] = null;
      pendingPreviewUrlsRef.current[itemId] = null;
      updateItemImageState(itemId, { pendingFile: null, pendingPreviewUrl: null, error: validationError.message });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    pendingFilesRef.current[itemId] = file;
    pendingPreviewUrlsRef.current[itemId] = previewUrl;
    updateItemImageState(itemId, { pendingFile: file, pendingPreviewUrl: previewUrl, error: null });
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (file) handleItemFileSelected(file, itemId);
    e.target.value = '';
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault();
    setItemDragOver((prev) => ({ ...prev, [itemId]: false }));
    const file = e.dataTransfer.files[0];
    if (file) handleItemFileSelected(file, itemId);
  };

  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault();
    setItemDragOver((prev) => ({ ...prev, [itemId]: true }));
  };

  const handleItemDragLeave = (itemId: string) => {
    setItemDragOver((prev) => ({ ...prev, [itemId]: false }));
  };

  const openItemFilePicker = (itemId: string) => {
    itemInputRefs.current[itemId]?.click();
  };

  const handleItemImageSave = async (itemId: string) => {
    const file = pendingFilesRef.current[itemId];
    if (!file) return;

    updateItemImageState(itemId, { isUploading: true, progress: 0, error: null });
    try {
      await itemImageService.upload(file, itemId, (percent) => {
        updateItemImageState(itemId, { progress: percent });
      });
      if (pendingPreviewUrlsRef.current[itemId]) {
        URL.revokeObjectURL(pendingPreviewUrlsRef.current[itemId]!);
      }
      pendingFilesRef.current[itemId] = null;
      pendingPreviewUrlsRef.current[itemId] = null;
      updateItemImageState(itemId, { pendingFile: null, pendingPreviewUrl: null });
      await refreshCategories();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar imagem. Tente novamente.';
      updateItemImageState(itemId, { error: message });
    } finally {
      updateItemImageState(itemId, { isUploading: false, progress: 0 });
    }
  };

  const handleItemCancelPending = (itemId: string) => {
    if (pendingPreviewUrlsRef.current[itemId]) {
      URL.revokeObjectURL(pendingPreviewUrlsRef.current[itemId]!);
    }
    pendingFilesRef.current[itemId] = null;
    pendingPreviewUrlsRef.current[itemId] = null;
    updateItemImageState(itemId, { pendingFile: null, pendingPreviewUrl: null, error: null });
  };

  const handleItemImageRemove = async (itemId: string) => {
    if (pendingPreviewUrlsRef.current[itemId]) {
      URL.revokeObjectURL(pendingPreviewUrlsRef.current[itemId]!);
    }
    pendingFilesRef.current[itemId] = null;
    pendingPreviewUrlsRef.current[itemId] = null;
    updateItemImageState(itemId, { pendingFile: null, pendingPreviewUrl: null, error: null });

    try {
      await itemImageService.remove(itemId);
      await refreshCategories();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao remover imagem. Tente novamente.';
      updateItemImageState(itemId, { error: message });
    }
  };

  const getItemImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    return itemImageService.getPublicUrl(imagePath);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-card shadow-card p-6">
        <ContainerImageManager />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-alencar-dark">Gerenciar Categorias e Itens</h2>
          <p className="text-gray-600">
            Modo: <span className={`font-semibold ${isVenda ? 'text-alencar-green' : 'text-alencar-green-light'}`}>
              {isVenda ? 'Venda' : 'Locação'}
            </span> - Configure os itens disponíveis
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2 btn-primary"
          >
            <Plus size={16} />
            Nova Categoria {isLocacao ? '(Locação)' : '(Venda)'}
          </button>
        </div>
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-card shadow-modal p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Categoria</h3>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ name: e.target.value })}
              placeholder="Nome da categoria"
              className="w-full p-3 border border-gray-300 rounded-lg input-base mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddCategory}
                className="flex-1 btn-primary"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory({ name: '' });
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              {editingCategory === category.id ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="text"
                    defaultValue={category.name}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateCategory(category.id, e.currentTarget.value);
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-lg input-base"
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      if (input) {
                        handleUpdateCategory(category.id, input.value);
                      }
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Package className={category.isActive === false ? "text-gray-400" : "text-alencar-green"} size={20} />
                    <h3 className={`text-xl font-bold ${category.isActive === false ? 'text-gray-400' : 'text-alencar-dark'}`}>
                      {category.name}
                      {category.isActive === false && <span className="text-red-500 text-sm ml-2">(Inativo)</span>}
                    </h3>
                    <span className={`${category.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-alencar-bg text-alencar-green'} px-2 py-1 rounded-full text-sm`}>
                      {category.items.length} itens
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCategoryStatus(category.id, category.isActive ?? true)}
                      className={`p-1 ${category.isActive === false ? 'text-gray-400 hover:text-gray-600' : 'text-green-600 hover:text-green-800'}`}
                      title={category.isActive === false ? "Ativar categoria" : "Desativar categoria"}
                    >
                      {category.isActive === false ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => setShowAddItem(category.id)}
                      className="text-alencar-green hover:text-alencar-dark p-1"
                      title="Adicionar item"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => setEditingCategory(category.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar categoria"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir categoria"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {showAddItem === category.id && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Adicionar Novo Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do item"
                    className="p-2 border border-gray-300 rounded-lg input-base"
                  />
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Preço (R$)"
                    className="p-2 border border-gray-300 rounded-lg input-base"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddItem(category.id)}
                    className="btn-primary px-4 py-2"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddItem(null);
                      setNewItem({ categoryId: '', name: '', price: '' });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {category.items.map((item) => {
                const imgState = getItemImageState(item.id);
                const imageUrl = getItemImageUrl(item.image_path);

                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                      {editingItem?.categoryId === category.id && editingItem?.itemId === item.id ? (
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="text"
                            defaultValue={item.name}
                            className="flex-1 p-2 border border-gray-300 rounded-lg input-base"
                            id={`item-name-${item.id}`}
                          />
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-gray-500" />
                            <input
                              type="number"
                              defaultValue={item.price}
                              className="w-24 p-2 border border-gray-300 rounded-lg input-base"
                              id={`item-price-${item.id}`}
                            />
                          </div>
                          <button
                            onClick={() => {
                              const nameInput = document.getElementById(`item-name-${item.id}`) as HTMLInputElement;
                              const priceInput = document.getElementById(`item-price-${item.id}`) as HTMLInputElement;
                              if (nameInput && priceInput) {
                                handleUpdateItem(item.id, nameInput.value, priceInput.value);
                              }
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span className={`font-medium ${item.isActive === false ? 'text-gray-400' : ''}`}>
                              {item.name}
                              {item.isActive === false && <span className="text-red-500 text-sm ml-1">(Inativo)</span>}
                            </span>
                            <span className={`font-bold ${item.isActive === false ? 'text-gray-400' : 'text-alencar-green'}`}>
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateItemImageState(item.id, { showUpload: !imgState.showUpload })}
                              className={`p-1 transition-colors ${imageUrl ? 'text-alencar-green hover:text-alencar-dark' : 'text-gray-400 hover:text-gray-600'}`}
                              title="Gerenciar imagem"
                            >
                              <ImageIcon size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleItemStatus(item.id, item.isActive ?? true)}
                              className={`p-1 ${item.isActive === false ? 'text-gray-400 hover:text-gray-600' : 'text-green-600 hover:text-green-800'}`}
                              title={item.isActive === false ? "Ativar item" : "Desativar item"}
                            >
                              {item.isActive === false ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              onClick={() => setEditingItem({ categoryId: category.id, itemId: item.id })}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Editar item"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Excluir item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {imgState.showUpload && editingItem?.itemId !== item.id && (
                      <div className="px-3 pb-3 bg-gray-900/5 border-t border-gray-200">
                        <div className="pt-3 max-w-xs space-y-3">
                          {imgState.error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-red-700 flex-1">{imgState.error}</p>
                              <button
                                onClick={() => updateItemImageState(item.id, { error: null })}
                                className="text-red-400 hover:text-red-600 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {imgState.pendingPreviewUrl ? (
                            <div className="space-y-3">
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img
                                  src={imgState.pendingPreviewUrl}
                                  alt="Pré-visualização"
                                  className="w-full h-full object-cover"
                                />
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
                                  onClick={() => openItemFilePicker(item.id)}
                                  disabled={imgState.isUploading}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Alterar imagem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleItemCancelPending(item.id)}
                                  disabled={imgState.isUploading}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Remover imagem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleItemImageSave(item.id)}
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
                                <img
                                  src={imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => openItemFilePicker(item.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                                >
                                  Alterar imagem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleItemImageRemove(item.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                                >
                                  Remover imagem
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div
                                onClick={() => openItemFilePicker(item.id)}
                                onDrop={(e) => handleItemDrop(e, item.id)}
                                onDragOver={(e) => handleItemDragOver(e, item.id)}
                                onDragLeave={() => handleItemDragLeave(item.id)}
                                className={`
                                  w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
                                  ${itemDragOver[item.id]
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                  }
                                `}
                              >
                                {itemDragOver[item.id] ? (
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
                                onClick={() => openItemFilePicker(item.id)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                <UploadCloud size={16} />
                                Adicionar imagem
                              </button>
                            </div>
                          )}

                          <input
                            ref={(el) => { itemInputRefs.current[item.id] = el; }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleItemInputChange(e, item.id)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {category.items.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum item nesta categoria</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
