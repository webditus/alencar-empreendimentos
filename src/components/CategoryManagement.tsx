import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import { useOperation } from '../contexts/OperationContext';
import { formatCurrency } from '../utils/formatters';

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
  } = useCategories();

  const { operationType, isVenda, isAluguel } = useOperation();

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-alencar-dark">Gerenciar Categorias e Itens</h2>
          <p className="text-gray-600">
            Modo: <span className={`font-semibold ${isVenda ? 'text-blue-600' : 'text-green-600'}`}>
              {isVenda ? 'Venda' : 'Aluguel'}
            </span> - Configure os itens disponíveis
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2 btn-primary"
          >
            <Plus size={16} />
            Nova Categoria {isAluguel ? '(Aluguel)' : '(Venda)'}
          </button>
        </div>
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
          <div key={category.id} className="bg-white rounded-lg shadow-lg p-6">
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
                      <Edit2 size={16} />
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
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
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
                          <Edit2 size={14} />
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
              ))}
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
