import { supabase } from '../lib/supabase';
import { Category, Item, OperationType } from '../types';

// Tipos para o banco de dados
export interface DatabaseCategory {
  id: string;
  name: string;
  operation_type: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  operation_type: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Serviços para Categorias
export class CategoryService {
  // Buscar todas as categorias com seus itens
  static async getAllCategories(): Promise<Category[]> {
    try {
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Buscar todos os itens
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (itemsError) throw itemsError;

      // Agrupar itens por categoria
      const categories: Category[] = categoriesData.map((category: DatabaseCategory) => ({
        id: category.id,
        name: category.name,
        operationType: category.operation_type as OperationType,
        isActive: category.is_active ?? true,
        items: itemsData
          .filter((item: DatabaseItem) => item.category_id === category.id)
          .map((item: DatabaseItem) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category: category.name,
            operationType: item.operation_type as OperationType,
            isActive: item.is_active ?? true,
          })),
      }));

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  // Criar nova categoria
  static async createCategory(name: string, operationType: OperationType = 'venda'): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, operation_type: operationType }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        operationType: data.operation_type as OperationType,
        isActive: data.is_active ?? true,
        items: [],
      };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  // Atualizar categoria
  static async updateCategory(id: string, name: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  // Deletar categoria (e todos os itens relacionados)
  static async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  }

  // Alternar status ativo/inativo da categoria
  static async toggleCategoryStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error);
      throw error;
    }
  }
}

// Serviços para Itens
export class ItemService {
  // Criar novo item
  static async createItem(categoryId: string, name: string, price: number, operationType: OperationType = 'venda'): Promise<Item> {
    try {
      // Buscar nome da categoria
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;

      // Criar item
      const { data, error } = await supabase
        .from('items')
        .insert([{ name, price, category_id: categoryId, operation_type: operationType }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        price: data.price,
        category: categoryData.name,
        operationType: data.operation_type as OperationType,
        isActive: data.is_active ?? true,
      };
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw error;
    }
  }

  // Atualizar item
  static async updateItem(id: string, name: string, price: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('items')
        .update({ name, price })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      throw error;
    }
  }

  // Deletar item
  static async deleteItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      throw error;
    }
  }

  // Alternar status ativo/inativo do item
  static async toggleItemStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao alterar status do item:', error);
      throw error;
    }
  }

  // Buscar itens por categoria
  static async getItemsByCategory(categoryId: string): Promise<Item[]> {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          price,
          operation_type,
          categories!inner(name)
        `)
        .eq('category_id', categoryId)
        .order('name');

      if (itemsError) throw itemsError;

      return itemsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.categories.name,
        operationType: item.operation_type as OperationType,
        isActive: item.is_active ?? true,
      }));
    } catch (error) {
      console.error('Erro ao buscar itens por categoria:', error);
      throw error;
    }
  }
}
