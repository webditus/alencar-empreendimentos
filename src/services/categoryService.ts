import { supabase } from '../lib/supabase';
import { Category, Item } from '../types';

export interface DatabaseCategory {
  id: string;
  name: string;
  display_order: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseItem {
  id: string;
  name: string;
  venda_price: number | null;
  locacao_price: number | null;
  show_venda: boolean;
  show_locacao: boolean;
  display_order: number;
  category_id: string;
  is_active?: boolean;
  image_path?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export class CategoryService {
  static async getAllCategories(): Promise<Category[]> {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('display_order');

      if (itemsError) throw itemsError;

      const categories: Category[] = categoriesData.map((category: DatabaseCategory) => ({
        id: category.id,
        name: category.name,
        displayOrder: category.display_order,
        isActive: category.is_active ?? true,
        items: itemsData
          .filter((item: DatabaseItem) => item.category_id === category.id)
          .map((item: DatabaseItem) => ({
            id: item.id,
            name: item.name,
            vendaPrice: item.venda_price,
            locacaoPrice: item.locacao_price,
            showVenda: item.show_venda,
            showLocacao: item.show_locacao,
            displayOrder: item.display_order,
            category: category.name,
            isActive: item.is_active ?? true,
            image_path: item.image_path ?? null,
          })),
      }));

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  static async createCategory(name: string, displayOrder?: number): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, display_order: displayOrder ?? 0 }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        displayOrder: data.display_order,
        isActive: data.is_active ?? true,
        items: [],
      };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, name: string, displayOrder?: number): Promise<void> {
    try {
      const payload: Record<string, unknown> = { name };
      if (displayOrder !== undefined) {
        payload.display_order = displayOrder;
      }

      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

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

export class ItemService {
  static async createItem(
    categoryId: string,
    name: string,
    vendaPrice: number | null,
    locacaoPrice: number | null,
    showVenda: boolean,
    showLocacao: boolean,
    displayOrder?: number
  ): Promise<Item> {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;

      const { data, error } = await supabase
        .from('items')
        .insert([{
          name,
          venda_price: vendaPrice,
          locacao_price: locacaoPrice,
          show_venda: showVenda,
          show_locacao: showLocacao,
          display_order: displayOrder ?? 0,
          category_id: categoryId,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        vendaPrice: data.venda_price,
        locacaoPrice: data.locacao_price,
        showVenda: data.show_venda,
        showLocacao: data.show_locacao,
        displayOrder: data.display_order,
        category: categoryData.name,
        isActive: data.is_active ?? true,
        image_path: data.image_path ?? null,
      };
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw error;
    }
  }

  static async updateItem(
    id: string,
    name: string,
    vendaPrice: number | null,
    locacaoPrice: number | null,
    showVenda: boolean,
    showLocacao: boolean,
    displayOrder?: number
  ): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        name,
        venda_price: vendaPrice,
        locacao_price: locacaoPrice,
        show_venda: showVenda,
        show_locacao: showLocacao,
      };
      if (displayOrder !== undefined) {
        payload.display_order = displayOrder;
      }

      const { error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      throw error;
    }
  }

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
}
