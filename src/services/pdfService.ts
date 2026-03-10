import jsPDF from 'jspdf';
import { Quote, Item } from '../types';
import { ContainerSize } from '../components/ContainerSizeSelector';

const BRAND_GREEN = [36, 119, 92] as [number, number, number];
const BRAND_GREEN_LIGHT = [68, 161, 124] as [number, number, number];
const BRAND_DARK = [13, 33, 26] as [number, number, number];
const BRAND_DARK_MID = [22, 55, 45] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const GRAY_DARK = [45, 55, 50] as [number, number, number];
const GRAY_MID = [90, 105, 98] as [number, number, number];
const GRAY_LIGHT = [220, 230, 226] as [number, number, number];
const ACCENT_GOLD = [212, 168, 80] as [number, number, number];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function setRGB(doc: jsPDF, color: [number, number, number], type: 'fill' | 'text' | 'draw' = 'fill') {
  if (type === 'fill') doc.setFillColor(color[0], color[1], color[2]);
  else if (type === 'text') doc.setTextColor(color[0], color[1], color[2]);
  else doc.setDrawColor(color[0], color[1], color[2]);
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function drawGeoBackground(doc: jsPDF) {
  setRGB(doc, BRAND_DARK, 'fill');
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setGState(doc.GState({ opacity: 0.06 }));
  setRGB(doc, BRAND_GREEN_LIGHT, 'fill');
  doc.rect(0, 0, PAGE_W, 6, 'F');

  doc.setGState(doc.GState({ opacity: 0.04 }));
  setRGB(doc, BRAND_GREEN_LIGHT, 'fill');
  for (let i = 0; i < 8; i++) {
    const x = -20 + i * 30;
    const y = 140 + i * 8;
    doc.triangle(x, y + 60, x + 50, y, x + 100, y + 60, 'F');
  }

  doc.setGState(doc.GState({ opacity: 1 }));

  setRGB(doc, [10, 26, 20], 'fill');
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

function drawPremiumCover(doc: jsPDF, operationType: string) {
  const isAluguel = operationType === 'aluguel';

  setRGB(doc, BRAND_DARK, 'fill');
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  setRGB(doc, BRAND_DARK_MID, 'fill');
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.55, 'F');

  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(0, 0, 6, PAGE_H, 'F');

  doc.setGState(doc.GState({ opacity: 0.07 }));
  setRGB(doc, BRAND_GREEN_LIGHT, 'fill');
  for (let i = 0; i < 12; i++) {
    const x = 6 + i * 18;
    doc.rect(x, 0, 9, PAGE_H * 0.55, 'F');
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(6, PAGE_H * 0.55, PAGE_W - 6, 3, 'F');

  doc.setGState(doc.GState({ opacity: 0.15 }));
  setRGB(doc, BRAND_GREEN_LIGHT, 'fill');
  doc.circle(PAGE_W - 30, 60, 120, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setGState(doc.GState({ opacity: 0.06 }));
  setRGB(doc, WHITE, 'fill');
  doc.triangle(PAGE_W * 0.5, 0, PAGE_W, 0, PAGE_W, PAGE_H * 0.3, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  setRGB(doc, BRAND_GREEN_LIGHT, 'draw');
  doc.setLineWidth(0.3);
  doc.setGState(doc.GState({ opacity: 0.2 }));
  doc.circle(PAGE_W / 2, PAGE_H * 0.27, 80, 'D');
  doc.circle(PAGE_W / 2, PAGE_H * 0.27, 60, 'D');
  doc.setGState(doc.GState({ opacity: 1 }));

  try {
    const logoImg = new Image();
    logoImg.src = '/logotipo-alencar-empreendimentos-horizontal.webp';
    doc.addImage('/logotipo-alencar-empreendimentos-horizontal.webp', 'WEBP', MARGIN, 22, 72, 18);
  } catch {
    setRGB(doc, WHITE, 'text');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALENCAR EMPREENDIMENTOS', MARGIN, 34);
  }

  const badgeLabel = isAluguel ? 'LOCAÇÃO' : 'VENDA';
  const badgeX = PAGE_W - MARGIN - 38;
  const badgeY = 20;
  const badgeColor: [number, number, number] = isAluguel ? BRAND_GREEN_LIGHT : ACCENT_GOLD;

  setRGB(doc, badgeColor, 'fill');
  doc.roundedRect(badgeX, badgeY, 38, 12, 2, 2, 'F');
  setRGB(doc, BRAND_DARK, 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeLabel, badgeX + 19, badgeY + 7.5, { align: 'center' });

  setRGB(doc, WHITE, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setGState(doc.GState({ opacity: 0.55 }));
  doc.text('PROPOSTA COMERCIAL', MARGIN, PAGE_H * 0.42);
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  setRGB(doc, WHITE, 'text');
  const titleLine1 = isAluguel ? 'Proposta de' : 'Proposta de';
  const titleLine2 = isAluguel ? 'Locação' : 'Venda';
  doc.text(titleLine1, MARGIN, PAGE_H * 0.48);
  setRGB(doc, BRAND_GREEN_LIGHT, 'text');
  doc.text(titleLine2, MARGIN, PAGE_H * 0.48 + 13);

  setRGB(doc, WHITE, 'text');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setGState(doc.GState({ opacity: 0.7 }));
  doc.text('de Container Personalizado', MARGIN, PAGE_H * 0.48 + 22);
  doc.setGState(doc.GState({ opacity: 1 }));

  setRGB(doc, BRAND_GREEN_LIGHT, 'draw');
  doc.setLineWidth(0.5);
  doc.line(MARGIN, PAGE_H * 0.57, PAGE_W - MARGIN, PAGE_H * 0.57);

  const infoY = PAGE_H * 0.6;
  setRGB(doc, WHITE, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPRESA', MARGIN, infoY);
  doc.text('CONTATO', PAGE_W / 2, infoY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setRGB(doc, GRAY_LIGHT, 'text');
  doc.text('Alencar Empreendimentos', MARGIN, infoY + 7);
  doc.text('contato@alencarempreendimentos.com.br', PAGE_W / 2, infoY + 7);
  doc.setFontSize(9);
  setRGB(doc, GRAY_MID, 'text');
  doc.setGState(doc.GState({ opacity: 0.7 }));
  doc.text('Containers para locação e venda', MARGIN, infoY + 13);
  doc.text('WhatsApp: (11) 93499-1883', PAGE_W / 2, infoY + 13);
  doc.setGState(doc.GState({ opacity: 1 }));

  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(6, PAGE_H - 26, PAGE_W - 6, 26, 'F');
  setRGB(doc, WHITE, 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setGState(doc.GState({ opacity: 0.6 }));
  doc.text(
    `Proposta gerada em ${new Date().toLocaleDateString('pt-BR')} — Alencar Empreendimentos`,
    PAGE_W / 2,
    PAGE_H - 12,
    { align: 'center' }
  );
  doc.setGState(doc.GState({ opacity: 1 }));
}

function addPageHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  setRGB(doc, BRAND_DARK, 'fill');
  doc.rect(0, 0, PAGE_W, 16, 'F');
  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(0, 0, 4, 16, 'F');

  try {
    doc.addImage('/logotipo-alencar-empreendimentos-horizontal.webp', 'WEBP', 10, 3, 40, 10);
  } catch {
    setRGB(doc, WHITE, 'text');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ALENCAR EMPREENDIMENTOS', 10, 10);
  }

  setRGB(doc, GRAY_MID, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_W - MARGIN, 10, { align: 'right' });
}

function addPageFooter(doc: jsPDF) {
  setRGB(doc, BRAND_DARK, 'fill');
  doc.rect(0, PAGE_H - 14, PAGE_W, 14, 'F');
  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(0, PAGE_H - 14, 4, 14, 'F');

  setRGB(doc, GRAY_MID, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('contato@alencarempreendimentos.com.br  |  (11) 93499-1883', MARGIN, PAGE_H - 5);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    PAGE_W - MARGIN,
    PAGE_H - 5,
    { align: 'right' }
  );
}

function drawSectionTitle(doc: jsPDF, label: string, y: number) {
  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(MARGIN, y - 5, 3, 9, 'F');
  setRGB(doc, BRAND_DARK, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), MARGIN + 6, y + 1);
  setRGB(doc, GRAY_LIGHT, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 5, MARGIN + CONTENT_W, y + 5);
  return y + 12;
}

function drawLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth?: number) {
  setRGB(doc, GRAY_MID, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), x, y);
  setRGB(doc, GRAY_DARK, 'text');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const displayValue = value || 'Não informado';
  if (maxWidth) {
    const lines = doc.splitTextToSize(displayValue, maxWidth);
    doc.text(lines[0], x, y + 5.5);
  } else {
    doc.text(displayValue, x, y + 5.5);
  }
}

export interface GenerateQuotePDFOptions {
  quote: Quote;
  selectedContainer?: ContainerSize | null;
}

export const generateQuotePDF = (quoteOrOptions: Quote | GenerateQuotePDFOptions, legacyContainer?: ContainerSize | null): void => {
  let quote: Quote;
  let selectedContainer: ContainerSize | null | undefined;

  if ('quote' in quoteOrOptions && quoteOrOptions.quote) {
    quote = quoteOrOptions.quote;
    selectedContainer = quoteOrOptions.selectedContainer;
  } else {
    quote = quoteOrOptions as Quote;
    selectedContainer = legacyContainer;
  }

  const isAluguel = quote.operationType === 'aluguel';
  const operationLabel = isAluguel ? 'Locação' : 'Venda';

  const itemsByCategory: Record<string, Item[]> = {};
  quote.selectedItems.forEach(item => {
    const cat = item.category || 'Outros';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });
  const categoryNames = Object.keys(itemsByCategory);

  const ITEMS_PER_PAGE = 14;
  const totalItemLines = quote.selectedItems.length + categoryNames.length;
  const itemPages = Math.max(1, Math.ceil(totalItemLines / ITEMS_PER_PAGE));
  const TOTAL_PAGES = 2 + itemPages;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  drawPremiumCover(doc, quote.operationType);

  doc.addPage();
  addPageHeader(doc, 2, TOTAL_PAGES);
  addPageFooter(doc);

  let y = 28;

  setRGB(doc, [240, 246, 244], 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 28, 'F');
  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(MARGIN, y, 4, 28, 'F');

  setRGB(doc, BRAND_GREEN, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA COMERCIAL DE ' + operationLabel.toUpperCase(), MARGIN + 10, y + 8);

  setRGB(doc, BRAND_DARK, 'text');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Container ${selectedContainer?.size ?? (quote.containerType ?? '')}`, MARGIN + 10, y + 19);

  const badgeLabel = isAluguel ? 'LOCAÇÃO' : 'VENDA';
  const badgeColor: [number, number, number] = isAluguel ? BRAND_GREEN_LIGHT : ACCENT_GOLD;
  setRGB(doc, badgeColor, 'fill');
  doc.roundedRect(PAGE_W - MARGIN - 32, y + 6, 32, 14, 3, 3, 'F');
  setRGB(doc, BRAND_DARK, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeLabel, PAGE_W - MARGIN - 16, y + 15, { align: 'center' });

  y += 38;

  y = drawSectionTitle(doc, 'Dados do Cliente', y);

  const col1 = MARGIN;
  const col2 = MARGIN + CONTENT_W / 3;
  const col3 = MARGIN + (CONTENT_W * 2) / 3;
  const colWidth = CONTENT_W / 3 - 4;

  drawLabelValue(doc, 'Nome Completo', quote.customer.name, col1, y, colWidth);
  drawLabelValue(doc, 'Telefone', quote.customer.phone, col2, y, colWidth);
  drawLabelValue(doc, 'E-mail', quote.customer.email, col3, y, colWidth);
  y += 18;

  drawLabelValue(doc, 'Endereço de Instalação', quote.customer.address, col1, y, CONTENT_W * 0.55);
  drawLabelValue(doc, 'Data Prevista', formatDate(quote.customer.projectDate), col3, y, colWidth);
  y += 18;

  const purposeStr = Array.isArray(quote.customer.purpose)
    ? quote.customer.purpose.join(', ')
    : (quote.customer.purpose || '');
  drawLabelValue(doc, 'Finalidade de Uso', purposeStr, col1, y, CONTENT_W);
  y += 20;

  y = drawSectionTitle(doc, 'Container Selecionado', y);

  setRGB(doc, [240, 246, 244], 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 26, 'F');
  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(MARGIN, y, 3, 26, 'F');

  const containerLabel = selectedContainer?.size ?? (quote.containerType ?? 'Container');
  const containerDesc = selectedContainer?.description ?? '';

  setRGB(doc, GRAY_DARK, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(containerLabel, MARGIN + 8, y + 10);
  if (containerDesc) {
    setRGB(doc, GRAY_MID, 'text');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(containerDesc, MARGIN + 8, y + 18);
  }

  const containerBasePrice = isAluguel
    ? (selectedContainer?.aluguelPrice ?? quote.basePrice)
    : (selectedContainer?.vendaPrice ?? quote.basePrice);

  const priceLabel = isAluguel ? '/mês' : '';
  const basePriceStr = formatBRL(containerBasePrice) + priceLabel;
  setRGB(doc, BRAND_GREEN, 'text');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(basePriceStr, PAGE_W - MARGIN, y + 10, { align: 'right' });
  setRGB(doc, GRAY_MID, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Valor base do container', PAGE_W - MARGIN, y + 17, { align: 'right' });

  y += 36;

  y = drawSectionTitle(doc, 'Proposta de Investimento', y);

  let pageItemCount = 0;
  let currentPage = 2;

  const startNextPage = () => {
    doc.addPage();
    currentPage++;
    addPageHeader(doc, currentPage, TOTAL_PAGES);
    addPageFooter(doc);
    y = 28;
    pageItemCount = 0;
  };

  for (let ci = 0; ci < categoryNames.length; ci++) {
    const catName = categoryNames[ci];
    const catItems = itemsByCategory[catName];

    if (pageItemCount > ITEMS_PER_PAGE - 3 && y > 230) {
      startNextPage();
      y = drawSectionTitle(doc, 'Proposta de Investimento (continuação)', y);
    }

    setRGB(doc, BRAND_DARK, 'fill');
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');
    setRGB(doc, BRAND_GREEN_LIGHT, 'fill');
    doc.rect(MARGIN, y, 2, 8, 'F');
    setRGB(doc, WHITE, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(catName.toUpperCase(), MARGIN + 6, y + 5.5);
    y += 10;
    pageItemCount++;

    let catSubtotal = 0;
    for (let ii = 0; ii < catItems.length; ii++) {
      const item = catItems[ii];
      catSubtotal += item.price;

      if (pageItemCount > ITEMS_PER_PAGE && y > 240) {
        startNextPage();
        y = drawSectionTitle(doc, 'Proposta de Investimento (continuação)', y);
      }

      const rowBg = ii % 2 === 0 ? ([248, 251, 250] as [number, number, number]) : (WHITE as [number, number, number]);
      setRGB(doc, rowBg, 'fill');
      doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
      setRGB(doc, GRAY_DARK, 'text');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(item.name, MARGIN + 4, y + 4.8);
      setRGB(doc, BRAND_GREEN, 'text');
      doc.setFont('helvetica', 'bold');
      doc.text(formatBRL(item.price), PAGE_W - MARGIN, y + 4.8, { align: 'right' });
      y += 7;
      pageItemCount++;
    }

    setRGB(doc, [232, 244, 240], 'fill');
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
    setRGB(doc, GRAY_MID, 'text');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal de ${catName}`, MARGIN + 4, y + 4.8);
    setRGB(doc, BRAND_GREEN, 'text');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(formatBRL(catSubtotal), PAGE_W - MARGIN, y + 4.8, { align: 'right' });
    y += 10;
    pageItemCount++;
  }

  if (y > PAGE_H - 70) {
    startNextPage();
  }

  y += 6;

  const totalBlockH = 32;
  setRGB(doc, BRAND_DARK, 'fill');
  doc.rect(MARGIN, y, CONTENT_W, totalBlockH, 'F');

  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(MARGIN, y, CONTENT_W, 2, 'F');
  doc.rect(MARGIN, y + totalBlockH - 2, CONTENT_W, 2, 'F');

  setRGB(doc, WHITE, 'text');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setGState(doc.GState({ opacity: 0.6 }));
  doc.text('INVESTIMENTO TOTAL', MARGIN + 8, y + 11);
  doc.setGState(doc.GState({ opacity: 1 }));

  if (isAluguel) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setGState(doc.GState({ opacity: 0.5 }));
    doc.text('(locação mensal)', MARGIN + 8, y + 18);
    doc.setGState(doc.GState({ opacity: 1 }));
  }

  setRGB(doc, BRAND_GREEN_LIGHT, 'text');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(quote.totalPrice) + (isAluguel ? '/mês' : ''), PAGE_W - MARGIN, y + 22, { align: 'right' });

  y += totalBlockH + 16;

  const noteH = 20;
  setRGB(doc, [240, 246, 244], 'fill');
  doc.rect(MARGIN, y, CONTENT_W, noteH, 'F');
  setRGB(doc, BRAND_GREEN, 'fill');
  doc.rect(MARGIN, y, 3, noteH, 'F');
  setRGB(doc, GRAY_DARK, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const noteLines = isAluguel
    ? [
        'Esta proposta tem validade de 7 dias corridos a partir da data de emissão.',
        'O valor mensal contempla locação do container com as personalizações descritas acima.',
        'Condições de frete e prazo de entrega a definir conforme local de instalação.'
      ]
    : [
        'Esta proposta tem validade de 7 dias corridos a partir da data de emissão.',
        'O valor total contempla a venda do container com as personalizações descritas acima.',
        'Condições de frete e prazo de entrega a definir conforme local de instalação.'
      ];
  noteLines.forEach((line, idx) => {
    doc.text(line, MARGIN + 7, y + 6 + idx * 5);
  });

  doc.save(`Proposta_Alencar_${quote.customer.name.replace(/\s+/g, '_')}.pdf`);
};
