import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Category } from '../types';
import { CategoryService, ItemService } from '../services/categoryService';
import { useOperation } from './OperationContext';

interface CategoryContextType {
  categories: Category[];
  allCategories: Category[];
  adminCategories: Category[];
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string, displayOrder?: number) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string, isActive: boolean) => Promise<void>;
  addItemToCategory: (
    categoryId: string,
    name: string,
    vendaPrice: number | null,
    locacaoPrice: number | null,
    showVenda: boolean,
    showLocacao: boolean
  ) => Promise<void>;
  updateItem: (
    itemId: string,
    name: string,
    vendaPrice: number | null,
    locacaoPrice: number | null,
    showVenda: boolean,
    showLocacao: boolean,
    displayOrder?: number
  ) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItemStatus: (id: string, isActive: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { operationType } = useOperation();

  const isVenda = operationType === 'venda';

  const categories = useMemo(() => {
    return allCategories
      .filter(category => category.isActive !== false)
      .map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.isActive !== false &&
          (isVenda ? item.showVenda : item.showLocacao)
        )
      }))
      .filter(category => category.items.length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [allCategories, isVenda]);

  const adminCategories = useMemo(() => {
    return [...allCategories].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [allCategories]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CategoryService.getAllCategories();
      setAllCategories(data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias do banco de dados. Verifique sua conexão.');
      setAllCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCategories = async () => {
    await loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async (name: string): Promise<void> => {
    try {
      setError(null);
      const newCategory = await CategoryService.createCategory(name);
      setAllCategories(prev => [...prev, newCategory]);
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err);
      setError('Erro ao adicionar categoria');
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string, displayOrder?: number): Promise<void> => {
    try {
      setError(null);
      await CategoryService.updateCategory(id, name, displayOrder);
      setAllCategories(prev => prev.map(category =>
        category.id === id
          ? { ...category, name, ...(displayOrder !== undefined ? { displayOrder } : {}) }
          : category
      ));
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
      setError('Erro ao atualizar categoria');
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      setError(null);
      await CategoryService.deleteCategory(id);
      setAllCategories(prev => prev.filter(category => category.id !== id));
    } catch (err) {
      console.error('Erro ao deletar categoria:', err);
      setError('Erro ao deletar categoria');
      throw err;
    }
  };

  const addItemToCategory = async (
    categoryId: string,
    name: string,
    vendaPrice: number | null,
    locacaoPrice: number | null,
    showVenda: boolean,
    showLocacao: boolean
  ): Promise<void> => {
    try {
      setError(null);
      const newItem = await ItemService.createItem(categoryId, name, vendaPrice, locacaoPrice, showVenda, showLocacao);

      setAllCategories(prev => prev.map(category =>
        category.id === categoryId
          ? { ...category, items: [...category.items, newItem] }
          : category
      ));
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      setError('Erro ao adicionar item');
      throw err;
    }
  };

  const updateItem = async (
    itemId: string,
    name: string,
    vendaPrice: number | null,
    locacaoPrice: number | null,
    showVenda: boolean,
    showLocacao: boolean,
    displayOrder?: number
  ): Promise<void> => {
    try {
      setError(null);
      await ItemService.updateItem(itemId, name, vendaPrice, locacaoPrice, showVenda, showLocacao, displayOrder);
      setAllCategories(prev => prev.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                name,
                vendaPrice,
                locacaoPrice,
                showVenda,
                showLocacao,
                ...(displayOrder !== undefined ? { displayOrder } : {}),
              }
            : item
        )
      })));
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
      setError('Erro ao atualizar item');
      throw err;
    }
  };

  const deleteItem = async (itemId: string): Promise<void> => {
    try {
      setError(null);
      await ItemService.deleteItem(itemId);
      setAllCategories(prev => prev.map(category => ({
        ...category,
        items: category.items.filter(item => item.id !== itemId)
      })));
    } catch (err) {
      console.error('Erro ao deletar item:', err);
      setError('Erro ao deletar item');
      throw err;
    }
  };

  const toggleCategoryStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      setError(null);
      await CategoryService.toggleCategoryStatus(id, isActive);
      setAllCategories(prev => prev.map(category =>
        category.id === id
          ? { ...category, isActive }
          : category
      ));
    } catch (err) {
      console.error('Erro ao alterar status da categoria:', err);
      setError('Erro ao alterar status da categoria');
      throw err;
    }
  };

  const toggleItemStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      setError(null);
      await ItemService.toggleItemStatus(id, isActive);
      setAllCategories(prev => prev.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === id
            ? { ...item, isActive }
            : item
        )
      })));
    } catch (err) {
      console.error('Erro ao alterar status do item:', err);
      setError('Erro ao alterar status do item');
      throw err;
    }
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      allCategories,
      adminCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategoryStatus,
      addItemToCategory,
      updateItem,
      deleteItem,
      toggleItemStatus,
      isLoading,
      error,
      refreshCategories
    }}>
      {children}
    </CategoryContext.Provider>
  );
};
