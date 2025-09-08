import { supabase } from '../lib/supabase';
import { 
  GeneratedContract, 
  ContractSignatory, 
  ContractAuditLog, 
  ContractGenerationData,
  PublicSigningData 
} from '../types/contractSigning';

export class ContractSigningService {
  
  // Processar template com variáveis
  private static async processTemplateContent(templateId: string, variables: Record<string, string>): Promise<string> {
    try {
      // Buscar o template
      const { data: template, error } = await supabase
        .from('contract_templates')
        .select('content')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        console.warn('Template não encontrado, usando conteúdo padrão');
        return `<h1>Contrato</h1><p>Este é um contrato gerado automaticamente.</p><p>Variáveis: ${JSON.stringify(variables, null, 2)}</p>`;
      }

      let processedContent = template.content;

      // Substituir variáveis no formato {{variavel}}
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processedContent = processedContent.replace(regex, value || '');
      });

      return processedContent;
    } catch (error) {
      console.error('Error processing template:', error);
      return `<h1>Contrato</h1><p>Erro ao processar template. Variáveis: ${JSON.stringify(variables, null, 2)}</p>`;
    }
  }

  // Gerar novo contrato para assinatura
  static async generateContract(
    quoteId: string, 
    data: ContractGenerationData, 
    userId: string
  ): Promise<GeneratedContract> {
    try {
      // 1. Processar conteúdo do template
      const processedContent = await this.processTemplateContent(data.templateId, data.variables);

      // 2. Criar registro do contrato
      const { data: contract, error: contractError } = await supabase
        .from('generated_contracts')
        .insert({
          quote_id: quoteId,
          template_id: data.templateId,
          title: data.title,
          content: processedContent, // Agora com conteúdo processado
          variables: data.variables,
          status: 'creator_signed',
          created_by: userId,
          creator_signed_at: new Date().toISOString(),
          creator_signature_data: data.creatorSignature,
          signing_link: this.generateSigningToken()
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // 3. Criar signatários
      const signatories = data.signatories.map((signatory, index) => ({
        contract_id: contract.id,
        name: signatory.name,
        email: signatory.email,
        is_creator: signatory.isCreator || index === 0,
        order_index: index,
        status: signatory.isCreator || index === 0 ? 'signed' : 'available_to_sign',
        signed_at: signatory.isCreator || index === 0 ? new Date().toISOString() : null,
        signature_data: signatory.isCreator || index === 0 ? data.creatorSignature : null
      }));

      const { error: signatoriesError } = await supabase
        .from('contract_signatories')
        .insert(signatories);

      if (signatoriesError) throw signatoriesError;

      // 4. Log de auditoria
      await this.logAuditEvent(contract.id, null, 'contract_created', {
        created_by: userId,
        signatories_count: data.signatories.length
      });

      return this.mapContract(contract);
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  }

  // Buscar contrato por token público
  static async getContractBySigningLink(signingLink: string): Promise<{
    contract: GeneratedContract;
    signatories: ContractSignatory[];
  } | null> {
    try {
      const { data: contract, error: contractError } = await supabase
        .from('generated_contracts')
        .select('*')
        .eq('signing_link', signingLink)
        .single();

      if (contractError || !contract) return null;

      const { data: signatories, error: signatoriesError } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('contract_id', contract.id)
        .order('order_index');

      if (signatoriesError) throw signatoriesError;

      // Log de acesso
      await this.logAuditEvent(contract.id, null, 'link_accessed');

      return {
        contract: this.mapContract(contract),
        signatories: (signatories || []).map(this.mapSignatory)
      };
    } catch (error) {
      console.error('Error fetching contract by signing link:', error);
      throw error;
    }
  }

  // Assinar contrato
  static async signContract(
    signingLink: string,
    signingData: PublicSigningData
  ): Promise<void> {
    try {
      // 1. Verificar se contrato existe e signatário é válido
      const { data: contract } = await supabase
        .from('generated_contracts')
        .select('id, status')
        .eq('signing_link', signingLink)
        .single();

      if (!contract) throw new Error('Contrato não encontrado');

      const { data: signatory } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('id', signingData.signatoryId)
        .eq('contract_id', contract.id)
        .single();

      if (!signatory) throw new Error('Signatário não encontrado');
      if (signatory.signed_at) throw new Error('Este signatário já assinou');

      // 2. Capturar dados de auditoria
      const auditData = {
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        signature_verified: true
      };

      // 3. Atualizar signatário
      const { error: updateError } = await supabase
        .from('contract_signatories')
        .update({
          signed_at: new Date().toISOString(),
          signature_data: signingData.signature,
          status: 'signed',
          ip_address: auditData.ip_address,
          user_agent: auditData.user_agent
        })
        .eq('id', signingData.signatoryId);

      if (updateError) throw updateError;

      // 4. Verificar se todos assinaram
      const { data: allSignatories } = await supabase
        .from('contract_signatories')
        .select('signed_at')
        .eq('contract_id', contract.id);

      const allSigned = allSignatories?.every(s => s.signed_at);

      if (allSigned) {
        await supabase
          .from('generated_contracts')
          .update({
            status: 'completed',
            all_signed_at: new Date().toISOString()
          })
          .eq('id', contract.id);
      }

      // 5. Log de auditoria
      await this.logAuditEvent(
        contract.id, 
        signingData.signatoryId, 
        'signature_completed',
        auditData
      );
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  }

  // Buscar contratos gerados pelo usuário
  static async getContractsByUser(userId: string): Promise<GeneratedContract[]> {
    try {
      const { data, error } = await supabase
        .from('generated_contracts')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapContract);
    } catch (error) {
      console.error('Error fetching user contracts:', error);
      throw error;
    }
  }

  // Buscar signatários de um contrato
  static async getContractSignatories(contractId: string): Promise<ContractSignatory[]> {
    try {
      const { data, error } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('contract_id', contractId)
        .order('order_index');

      if (error) throw error;

      return (data || []).map(this.mapSignatory);
    } catch (error) {
      console.error('Error fetching contract signatories:', error);
      throw error;
    }
  }

  // Buscar logs de auditoria
  static async getContractAuditLog(contractId: string): Promise<ContractAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('contract_audit_log')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapAuditLog);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }

  // Utilitários privados
  private static generateSigningToken(): string {
    return 'sign_' + Math.random().toString(36).substring(2) + 
           Date.now().toString(36) + 
           Math.random().toString(36).substring(2);
  }

  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private static async logAuditEvent(
    contractId: string, 
    signatoryId: string | null, 
    action: string, 
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('contract_audit_log')
        .insert({
          contract_id: contractId,
          signatory_id: signatoryId,
          action,
          ip_address: await this.getClientIP(),
          user_agent: navigator?.userAgent || 'unknown',
          metadata
        });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Mappers
  private static mapContract(data: any): GeneratedContract {
    return {
      id: data.id,
      quoteId: data.quote_id,
      templateId: data.template_id,
      title: data.title || 'Contrato sem título',
      content: data.content,
      variables: data.variables || {},
      status: data.status || 'pending',
      createdBy: data.created_by,
      creatorSignedAt: data.creator_signed_at || undefined,
      creatorSignatureData: data.creator_signature_data,
      allSignedAt: data.all_signed_at || undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      signingLink: data.signing_link
    };
  }

  private static mapSignatory(data: any): ContractSignatory {
    return {
      id: data.id,
      contractId: data.contract_id,
      name: data.name,
      email: data.email,
      isCreator: data.is_creator,
      orderIndex: data.order_index,
      signedAt: data.signed_at,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      signatureData: data.signature_data,
      status: data.status
    };
  }

  // Verificar se existe contrato gerado para um orçamento
  static async getContractByQuoteId(quoteId: string): Promise<GeneratedContract | null> {
    try {
      const { data, error } = await supabase
        .from('generated_contracts')
        .select(`
          *,
          contract_signatories(*)
        `)
        .eq('quote_id', quoteId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapContract(data);
    } catch (error) {
      console.error('Erro ao buscar contrato por quote ID:', error);
      return null;
    }
  }

  private static mapAuditLog(data: any): ContractAuditLog {
    return {
      id: data.id,
      contractId: data.contract_id,
      signatoryId: data.signatory_id,
      action: data.action,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      metadata: data.metadata,
      createdAt: data.created_at
    };
  }
}
