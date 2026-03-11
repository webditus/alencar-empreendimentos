import React, { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Package, Eye, EyeOff, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import { formatCurrency } from '../utils/formatters';
import { ContainerImageManager } from './ContainerImageManager';
import { itemImageService } from '../services/itemImageService';
import { validateImageFile } from '../utils/imageUtils';
import { ItemImageSection } from './ItemImageSection';

interface NewItemForm {
  name: string;
  vendaPrice: string;
  locacaoPrice: string;
  showVenda: boolean;
  showLocacao: boolean;
}

const defaultNewItem: NewItemForm = {
  name: '',
  vendaPrice: '',
  locacaoPrice: '',
  showVenda: true,
  showLocacao: true,
};

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

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; itemId: string } | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newItem, setNewItem] = useState<NewItemForm>({ ...defaultNewItem });
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

  const defaultImageState: ItemImageState = { isUploading: false, progress: 0, error: null, showUpload: false, pendingFile: null, pendingPreviewUrl: null };

  const getItemImageState = (itemId: string): ItemImageState =>
    itemImageStates[itemId] ?? defaultImageState;

  const updateItemImageState = (itemId: string, patch: Partial<ItemImageState>) => {
    setItemImageStates((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? defaultImageState), ...patch },
    }));
  };

  const handleAddCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        await addCategory(newCategory.name.trim());
        setNewCategory({ name: '' });
        setShowAddCategory(false);
      } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
      }
    }
  };

  const handleAddItem = async (categoryId: string) => {
    if (!newItem.name.trim()) return;

    const hasVenda = newItem.showVenda && newItem.vendaPrice.trim() && parseFloat(newItem.vendaPrice) > 0;
    const hasLocacao = newItem.showLocacao && newItem.locacaoPrice.trim() && parseFloat(newItem.locacaoPrice) > 0;

    if (newItem.showVenda && !hasVenda) return;
    if (newItem.showLocacao && !hasLocacao) return;
    if (!newItem.showVenda && !newItem.showLocacao) return;

    try {
      await addItemToCategory(
        categoryId,
        newItem.name.trim(),
        newItem.showVenda ? parseFloat(newItem.vendaPrice) : null,
        newItem.showLocacao ? parseFloat(newItem.locacaoPrice) : null,
        newItem.showVenda,
        newItem.showLocacao
      );
      setNewItem({ ...defaultNewItem });
      setShowAddItem(null);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string, displayOrder?: number) => {
    if (name.trim()) {
      try {
        await updateCategory(categoryId, name.trim(), displayOrder);
        setEditingCategory(null);
      } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
      }
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    const nameInput = document.getElementById(`item-name-${itemId}`) as HTMLInputElement;
    const vendaPriceInput = document.getElementById(`item-venda-price-${itemId}`) as HTMLInputElement;
    const locacaoPriceInput = document.getElementById(`item-locacao-price-${itemId}`) as HTMLInputElement;
    const showVendaInput = document.getElementById(`item-show-venda-${itemId}`) as HTMLInputElement;
    const showLocacaoInput = document.getElementById(`item-show-locacao-${itemId}`) as HTMLInputElement;
    const displayOrderInput = document.getElementById(`item-display-order-${itemId}`) as HTMLInputElement;

    if (!nameInput?.value.trim()) return;

    const showVenda = showVendaInput?.checked ?? false;
    const showLocacao = showLocacaoInput?.checked ?? false;
    const vendaPrice = showVenda ? parseFloat(vendaPriceInput?.value || '0') : null;
    const locacaoPrice = showLocacao ? parseFloat(locacaoPriceInput?.value || '0') : null;
    const displayOrder = displayOrderInput ? parseInt(displayOrderInput.value || '0') : undefined;

    if (showVenda && (!vendaPrice || vendaPrice <= 0)) return;
    if (showLocacao && (!locacaoPrice || locacaoPrice <= 0)) return;
    if (!showVenda && !showLocacao) return;

    try {
      await updateItem(itemId, nameInput.value.trim(), vendaPrice, locacaoPrice, showVenda, showLocacao, displayOrder);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
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
      const message = err instanceof Error ? err.message : 'Erro ao enviar imagem. Tente novamente.';
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
      const message = err instanceof Error ? err.message : 'Erro ao remover imagem. Tente novamente.';
      updateItemImageState(itemId, { error: message });
    }
  };

  const getItemImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    return itemImageService.getPublicUrl(imagePath);
  };

  const renderPriceBadges = (item: { vendaPrice: number | null; locacaoPrice: number | null; showVenda: boolean; showLocacao: boolean }) => {
    const badges: React.ReactNode[] = [];
    if (item.showVenda && item.vendaPrice != null) {
      badges.push(
        <span key="v" className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
          V: {formatCurrency(item.vendaPrice)}
        </span>
      );
    }
    if (item.showLocacao && item.locacaoPrice != null) {
      badges.push(
        <span key="l" className="inline-flex items-center gap-1 text-xs font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
          L: {formatCurrency(item.locacaoPrice)}
        </span>
      );
    }
    return badges;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-card shadow-card p-6">
        <ContainerImageManager />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-alencar-dark">Gerenciar Categorias e Itens</h2>
          <p className="text-gray-600">Configure os itens disponíveis para venda e locação</p>
        </div>
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-2 px-4 py-2 btn-primary"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
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
              <button onClick={handleAddCategory} className="flex-1 btn-primary">
                Adicionar
              </button>
              <button
                onClick={() => { setShowAddCategory(false); setNewCategory({ name: '' }); }}
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
                    className="flex-1 p-2 border border-gray-300 rounded-lg input-base"
                    id={`cat-name-${category.id}`}
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500">Ordem:</label>
                    <input
                      type="number"
                      defaultValue={category.displayOrder}
                      className="w-16 p-2 border border-gray-300 rounded-lg input-base text-center"
                      id={`cat-order-${category.id}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const nameInput = document.getElementById(`cat-name-${category.id}`) as HTMLInputElement;
                      const orderInput = document.getElementById(`cat-order-${category.id}`) as HTMLInputElement;
                      if (nameInput) {
                        handleUpdateCategory(
                          category.id,
                          nameInput.value,
                          orderInput ? parseInt(orderInput.value || '0') : undefined
                        );
                      }
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingCategory(null)} className="text-gray-600 hover:text-gray-800">
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
                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                      #{category.displayOrder}
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
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do item"
                    className="w-full p-2 border border-gray-300 rounded-lg input-base"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newItem.showVenda}
                          onChange={(e) => setNewItem(prev => ({ ...prev, showVenda: e.target.checked }))}
                          className="rounded text-alencar-green focus:ring-alencar-green"
                        />
                        <span className="text-sm font-medium text-gray-700">Mostrar em Venda</span>
                      </label>
                      <input
                        type="number"
                        value={newItem.vendaPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, vendaPrice: e.target.value }))}
                        placeholder="Preco Venda (R$)"
                        disabled={!newItem.showVenda}
                        className="w-full p-2 border border-gray-300 rounded-lg input-base disabled:opacity-50 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newItem.showLocacao}
                          onChange={(e) => setNewItem(prev => ({ ...prev, showLocacao: e.target.checked }))}
                          className="rounded text-alencar-green focus:ring-alencar-green"
                        />
                        <span className="text-sm font-medium text-gray-700">Mostrar em Locacao</span>
                      </label>
                      <input
                        type="number"
                        value={newItem.locacaoPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, locacaoPrice: e.target.value }))}
                        placeholder="Preco Locacao (R$)"
                        disabled={!newItem.showLocacao}
                        className="w-full p-2 border border-gray-300 rounded-lg input-base disabled:opacity-50 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleAddItem(category.id)} className="btn-primary px-4 py-2">
                      Adicionar
                    </button>
                    <button
                      onClick={() => { setShowAddItem(null); setNewItem({ ...defaultNewItem }); }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
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
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              defaultValue={item.name}
                              className="flex-1 p-2 border border-gray-300 rounded-lg input-base"
                              id={`item-name-${item.id}`}
                            />
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-500">Ordem:</label>
                              <input
                                type="number"
                                defaultValue={item.displayOrder}
                                className="w-16 p-2 border border-gray-300 rounded-lg input-base text-center"
                                id={`item-display-order-${item.id}`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  defaultChecked={item.showVenda}
                                  id={`item-show-venda-${item.id}`}
                                  className="rounded text-alencar-green focus:ring-alencar-green"
                                />
                                <span className="text-xs font-medium text-gray-700">Venda</span>
                              </label>
                              <input
                                type="number"
                                defaultValue={item.vendaPrice ?? ''}
                                placeholder="Preco Venda"
                                className="w-full p-2 border border-gray-300 rounded-lg input-base text-sm"
                                id={`item-venda-price-${item.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  defaultChecked={item.showLocacao}
                                  id={`item-show-locacao-${item.id}`}
                                  className="rounded text-alencar-green focus:ring-alencar-green"
                                />
                                <span className="text-xs font-medium text-gray-700">Locacao</span>
                              </label>
                              <input
                                type="number"
                                defaultValue={item.locacaoPrice ?? ''}
                                placeholder="Preco Locacao"
                                className="w-full p-2 border border-gray-300 rounded-lg input-base text-sm"
                                id={`item-locacao-price-${item.id}`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => handleUpdateItem(item.id)} className="text-green-600 hover:text-green-800">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingItem(null)} className="text-gray-600 hover:text-gray-800">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`font-medium ${item.isActive === false ? 'text-gray-400' : ''}`}>
                              {item.name}
                              {item.isActive === false && <span className="text-red-500 text-sm ml-1">(Inativo)</span>}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {renderPriceBadges(item)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
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
                      <ItemImageSection
                        itemId={item.id}
                        itemName={item.name}
                        imgState={imgState}
                        imageUrl={imageUrl}
                        isDragOver={itemDragOver[item.id] ?? false}
                        onOpenFilePicker={openItemFilePicker}
                        onDrop={handleItemDrop}
                        onDragOver={handleItemDragOver}
                        onDragLeave={handleItemDragLeave}
                        onSave={handleItemImageSave}
                        onCancel={handleItemCancelPending}
                        onRemove={handleItemImageRemove}
                        onClearError={() => updateItemImageState(item.id, { error: null })}
                        onInputChange={handleItemInputChange}
                        inputRef={(el) => { itemInputRefs.current[item.id] = el; }}
                      />
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
