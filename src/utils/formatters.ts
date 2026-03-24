import { Quote } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
};

export const formatDate = (date: string): string => {
  if (!date || date === 'undefined' || date === 'null') {
    console.warn('⚠️ formatDate recebeu data inválida:', date);
    return 'Data não definida';
  }

  try {
    const parsedDate = new Date(date + 'T00:00:00');
    if (isNaN(parsedDate.getTime())) {
      console.warn('⚠️ formatDate não conseguiu parsear a data:', date);
      return 'Data inválida';
    }
    return parsedDate.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('❌ Erro ao formatar data:', error, 'Data original:', date);
    return 'Erro na data';
  }
};

const opt = (value: string | undefined | null): string => {
  if (!value || value.trim() === '' || value === 'undefined' || value === 'null') return '';
  return value.trim();
};

const line = (label: string, value: string | undefined | null): string => {
  const v = opt(value);
  if (!v) return '';
  return `${label}: ${v}`;
};

const resolvePurpose = (purpose: string[], purposeOther?: string): string => {
  if (!Array.isArray(purpose) || purpose.length === 0) return 'Não informado';
  return purpose
    .map(p => (p === 'Outro' && opt(purposeOther) ? purposeOther! : p))
    .join(', ');
};

const resolveInstallationLocation = (location?: string, locationOther?: string): string => {
  if (!opt(location)) return '';
  if (location === 'Outro' && opt(locationOther)) return locationOther!;
  return location!;
};

const resolvePropertyNumber = (propertyNumber?: string): string => {
  if (!opt(propertyNumber)) return 'Sem número';
  return propertyNumber!;
};

const resolveOperationType = (type: string): string => {
  if (type === 'locacao') return 'Locação';
  if (type === 'venda') return 'Compra';
  return type;
};

export const generateWhatsAppLink = (quote: Quote): string => {
  const c = quote.customer;

  const installationLocation = resolveInstallationLocation(
    c.installationLocation,
    c.installationLocationOther
  );

  const purposeList = resolvePurpose(c.purpose, c.purposeOther);
  const propertyNumber = resolvePropertyNumber(c.propertyNumber);

  const projectDateFormatted = opt(c.projectDate) ? formatDate(c.projectDate) : 'Não informado';

  const itemLines = quote.selectedItems.length > 0
    ? quote.selectedItems.map(item => `${item.name}: ${formatCurrency(item.price)}`).join('\n')
    : 'Nenhum item adicional selecionado';

  const addressLine = [
    opt(c.address),
    c.city && c.state ? `${c.city}/${c.state}` : opt(c.city) || opt(c.state),
  ].filter(Boolean).join(', ');

  const lines: string[] = [
    'Olá! Gostaria de mais informações sobre o orçamento de container.',
    '',
    '*Dados do cliente:*',
    line('Nome', c.name),
    line('Telefone', c.phone),
    line('E-mail', c.email),
    '',
    '*Local do projeto:*',
    line('CEP', c.cep),
    line('Endereço', addressLine || c.address),
    `Número: ${propertyNumber}`,
    ...(opt(c.addressComplement) ? [line('Complemento', c.addressComplement)] : []),
    '',
    '*Contexto do projeto:*',
    ...(opt(installationLocation) ? [line('Local de instalação', installationLocation)] : []),
    ...(opt(c.projectStartTimeline) ? [line('Prazo para iniciar', c.projectStartTimeline)] : []),
    `Data prevista: ${projectDateFormatted}`,
    `Finalidade de uso: ${purposeList}`,
    ...(opt(c.generalNotes) ? [line('Observações', c.generalNotes)] : []),
    '',
    '*Resumo do orçamento:*',
    `Tipo de operação: ${resolveOperationType(quote.operationType)}`,
    ...(opt(quote.containerType) ? [line('Container base', quote.containerType)] : ['Container base: Selecionado']),
    itemLines,
    '',
    `*Valor total: ${formatCurrency(quote.totalPrice)}*`,
    '',
    'Aguardo contato. Obrigado!',
  ];

  const message = lines.filter(l => l !== null).join('\n');

  return `https://wa.me/5511934991883?text=${encodeURIComponent(message)}`;
};

export const generateEmailLink = (quote: Quote): string => {
  const c = quote.customer;

  const installationLocation = resolveInstallationLocation(
    c.installationLocation,
    c.installationLocationOther
  );

  const purposeList = resolvePurpose(c.purpose, c.purposeOther);
  const propertyNumber = resolvePropertyNumber(c.propertyNumber);
  const projectDateFormatted = opt(c.projectDate) ? formatDate(c.projectDate) : 'Não informado';

  const addressLine = [
    opt(c.address),
    c.city && c.state ? `${c.city}/${c.state}` : opt(c.city) || opt(c.state),
  ].filter(Boolean).join(', ');

  const itemLines = quote.selectedItems.length > 0
    ? quote.selectedItems.map(item => `${item.name}: ${formatCurrency(item.price)}`).join('\n')
    : 'Nenhum item adicional selecionado';

  const subject = `Novo orçamento de container - ${c.name}`;

  const bodyLines: string[] = [
    'Olá,',
    '',
    'Um novo orçamento de container foi solicitado pelo simulador público.',
    '',
    '--- DADOS DO CLIENTE ---',
    line('Nome', c.name),
    line('Telefone', c.phone),
    line('E-mail', c.email),
    '',
    '--- LOCAL DO PROJETO ---',
    line('CEP', c.cep),
    line('Endereço', addressLine || c.address),
    `Número: ${propertyNumber}`,
    ...(opt(c.addressComplement) ? [line('Complemento', c.addressComplement)] : []),
    '',
    '--- CONTEXTO DO PROJETO ---',
    ...(opt(installationLocation) ? [line('Local de instalação', installationLocation)] : []),
    ...(opt(c.projectStartTimeline) ? [line('Prazo para iniciar', c.projectStartTimeline)] : []),
    `Data prevista: ${projectDateFormatted}`,
    `Finalidade de uso: ${purposeList}`,
    opt(c.generalNotes) ? line('Observações', c.generalNotes) : 'Observações: Não informado',
    '',
    '--- RESUMO DO ORÇAMENTO ---',
    `Tipo de operação: ${resolveOperationType(quote.operationType)}`,
    ...(opt(quote.containerType) ? [line('Container base', quote.containerType)] : ['Container base: Selecionado']),
    itemLines,
    '',
    `VALOR TOTAL: ${formatCurrency(quote.totalPrice)}`,
    '',
    'Atenciosamente,',
    'Simulador de Orçamentos — Alencar Empreendimentos',
  ];

  const body = bodyLines.filter(l => l !== null).join('\n');

  return `mailto:comercial@alencaremp.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
