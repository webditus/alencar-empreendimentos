import { supabase } from '../lib/supabase';
import { ContractTemplate } from '../types/contract';

export class ContractService {
  static async getAllTemplates(): Promise<ContractTemplate[]> {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contract templates:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      content: item.content,
      isActive: item.is_active,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
    }));
  }

  static async getTemplateById(id: string): Promise<ContractTemplate | null> {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contract template:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      content: data.content,
      isActive: data.is_active,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  }

  static async createTemplate(template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContractTemplate> {
    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        name: template.name,
        type: template.type,
        content: template.content,
        is_active: template.isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contract template:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      content: data.content,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async updateTemplate(id: string, updates: Partial<Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ContractTemplate> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('contract_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract template:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      content: data.content,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contract template:', error);
      throw error;
    }
  }

  static async toggleTemplateStatus(id: string, isActive: boolean): Promise<ContractTemplate> {
    const { data, error } = await supabase
      .from('contract_templates')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling contract template status:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      content: data.content,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async getTemplatesByType(type: string): Promise<ContractTemplate[]> {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching contract templates by type:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      content: item.content,
      isActive: item.is_active,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString(),
    }));
  }
}
