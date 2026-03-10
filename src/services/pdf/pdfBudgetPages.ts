import jsPDF from 'jspdf';
import { Quote, Item } from '../../types';
import { ContainerSize } from '../../components/ContainerSizeSelector';
import {
  BRAND, RGB, PAGE_W, PAGE_H, M, CONTENT_W,
  rgb, opacity, formatBRL, formatDateBR,
  drawCardDark, drawCardLight, drawGreenLeftAccent,
  drawSectionLabel, drawFieldLabel, drawHorizontalDivider, drawBadge,
} from './pdfDrawUtils';
import { drawPageShell, drawPageTitle, drawPageSubtitle } from './pdfPageComponents';

export interface BudgetData {
  quote: Quote;
  selectedContainer?: ContainerSize | null;
}

const SAFE_BOTTOM = PAGE_H - 30;
const ITEMS_PER_PAGE = 16;

export function drawBudgetPages(doc: jsPDF, data: BudgetData, startPage: number, totalPages: number): number {
  const { quote, selectedContainer } = data;
  const isAluguel = quote.operationType === 'aluguel';

  let currentPage = startPage;
  drawPageShell(doc, currentPage, totalPages);

  let y = 28;

  opacity(doc, 0.4);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ORCAMENTO DETALHADO', M, y);
  opacity(doc, 1);
  y += 8;

  y = drawPageTitle(doc, 'Configuracao e investimento', y);
  y += 4;

  const badgeLabel = isAluguel ? 'LOCACAO' : 'VENDA';
  const badgeColor: RGB = isAluguel ? BRAND.greenLight : BRAND.gold;
  drawBadge(doc, badgeLabel, PAGE_W - M - 36, 28, badgeColor);

  y = drawClientSection(doc, quote, y);
  y += 4;
  y = drawContainerSection(doc, quote, selectedContainer, isAluguel, y);
  y += 4;

  const result = drawItemsSection(doc, quote, isAluguel, y, currentPage, totalPages);
  y = result.y;
  currentPage = result.currentPage;

  if (y > SAFE_BOTTOM - 50) {
    doc.addPage();
    currentPage++;
    drawPageShell(doc, currentPage, totalPages);
    y = 28;
  }

  y = drawTotalSection(doc, quote, isAluguel, y);

  return currentPage;
}

function drawClientSection(doc: jsPDF, quote: Quote, startY: number): number {
  let y = drawSectionLabel(doc, 'Dados do cliente', startY);

  const cardH = 42;
  drawCardDark(doc, M, y, CONTENT_W, cardH, { accent: true, accentW: 3 });

  const px = M + 10;
  const col2 = M + CONTENT_W * 0.37;
  const col3 = M + CONTENT_W * 0.7;
  const colW = CONTENT_W * 0.3;

  drawFieldLabel(doc, 'Nome completo', quote.customer.name, px, y + 8, colW);
  drawFieldLabel(doc, 'Telefone', quote.customer.phone, col2, y + 8, colW);
  drawFieldLabel(doc, 'E-mail', quote.customer.email, col3, y + 8, colW);

  drawFieldLabel(doc, 'Endereco', quote.customer.address, px, y + 24, CONTENT_W * 0.55);

  const purposeStr = Array.isArray(quote.customer.purpose)
    ? quote.customer.purpose.join(', ')
    : (quote.customer.purpose || '');
  drawFieldLabel(doc, 'Finalidade', purposeStr, col3, y + 24, colW);

  return y + cardH + 4;
}

function drawContainerSection(doc: jsPDF, quote: Quote, selectedContainer: ContainerSize | null | undefined, isAluguel: boolean, startY: number): number {
  let y = drawSectionLabel(doc, 'Configuracao escolhida', startY);

  const cardH = 32;
  drawCardDark(doc, M, y, CONTENT_W, cardH, { accent: true, accentW: 3 });

  const containerLabel = selectedContainer?.size ?? (quote.containerType ?? 'Container');
  const containerDesc = selectedContainer?.description ?? '';

  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(containerLabel, M + 10, y + 13);

  if (containerDesc) {
    opacity(doc, 0.5);
    rgb(doc, BRAND.grayMuted, 'text');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(containerDesc, M + 10, y + 20);
    opacity(doc, 1);
  }

  if (quote.customer.projectDate) {
    opacity(doc, 0.5);
    rgb(doc, BRAND.greenLight, 'text');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA PREVISTA', M + 10, y + 26);
    opacity(doc, 1);
    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateBR(quote.customer.projectDate), M + 46, y + 26);
  }

  const containerBasePrice = isAluguel
    ? (selectedContainer?.aluguelPrice ?? quote.basePrice)
    : (selectedContainer?.vendaPrice ?? quote.basePrice);
  const priceStr = formatBRL(containerBasePrice) + (isAluguel ? '/mes' : '');

  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(priceStr, PAGE_W - M - 6, y + 13, { align: 'right' });

  opacity(doc, 0.4);
  rgb(doc, BRAND.grayMuted, 'text');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Valor base do container', PAGE_W - M - 6, y + 20, { align: 'right' });
  opacity(doc, 1);

  return y + cardH + 4;
}

function drawItemsSection(
  doc: jsPDF,
  quote: Quote,
  isAluguel: boolean,
  startY: number,
  startPage: number,
  totalPages: number
): { y: number; currentPage: number } {
  let y = drawSectionLabel(doc, 'Itens selecionados', startY);
  let currentPage = startPage;
  let lineCount = 0;

  const itemsByCategory: Record<string, Item[]> = {};
  quote.selectedItems.forEach(item => {
    const cat = item.category || 'Outros';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });
  const categoryNames = Object.keys(itemsByCategory);

  const startNextPage = () => {
    doc.addPage();
    currentPage++;
    drawPageShell(doc, currentPage, totalPages);
    y = 28;
    y = drawSectionLabel(doc, 'Itens selecionados (continuacao)', y);
    lineCount = 0;
  };

  for (let ci = 0; ci < categoryNames.length; ci++) {
    const catName = categoryNames[ci];
    const catItems = itemsByCategory[catName];

    if (lineCount > ITEMS_PER_PAGE - 3 && y > SAFE_BOTTOM - 40) {
      startNextPage();
    }

    rgb(doc, BRAND.dark, 'fill');
    doc.rect(M, y, CONTENT_W, 7.5, 'F');
    rgb(doc, BRAND.green, 'fill');
    doc.rect(M, y, 2.5, 7.5, 'F');

    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(catName.toUpperCase(), M + 8, y + 5);

    rgb(doc, BRAND.grayMuted, 'text');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${catItems.length} ${catItems.length === 1 ? 'item' : 'itens'}`, PAGE_W - M, y + 5, { align: 'right' });

    y += 9;
    lineCount++;

    let catSubtotal = 0;
    for (let ii = 0; ii < catItems.length; ii++) {
      const item = catItems[ii];
      catSubtotal += item.price;

      if (lineCount > ITEMS_PER_PAGE && y > SAFE_BOTTOM - 20) {
        startNextPage();
      }

      const rowAlpha = ii % 2 === 0 ? 0.03 : 0.0;
      if (rowAlpha > 0) {
        opacity(doc, rowAlpha);
        rgb(doc, BRAND.greenLight, 'fill');
        doc.rect(M, y, CONTENT_W, 7, 'F');
        opacity(doc, 1);
      }

      opacity(doc, 0.06);
      rgb(doc, BRAND.greenLight, 'draw');
      doc.setLineWidth(0.15);
      doc.line(M, y + 7, M + CONTENT_W, y + 7);
      opacity(doc, 1);

      rgb(doc, BRAND.grayLight, 'text');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(item.name, M + 6, y + 4.8);

      rgb(doc, BRAND.greenLight, 'text');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(formatBRL(item.price), PAGE_W - M, y + 4.8, { align: 'right' });

      y += 7;
      lineCount++;
    }

    opacity(doc, 0.06);
    rgb(doc, BRAND.green, 'fill');
    doc.rect(M, y, CONTENT_W, 7, 'F');
    opacity(doc, 1);

    rgb(doc, BRAND.grayMuted, 'text');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal ${catName}`, M + 6, y + 4.8);
    rgb(doc, BRAND.greenLight, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(formatBRL(catSubtotal), PAGE_W - M, y + 4.8, { align: 'right' });

    y += 10;
    lineCount++;
  }

  return { y, currentPage };
}

function drawTotalSection(doc: jsPDF, quote: Quote, isAluguel: boolean, startY: number): number {
  let y = startY + 4;

  y = drawSectionLabel(doc, 'Resumo do investimento', y);

  const itemsTotal = quote.selectedItems.reduce((sum, item) => sum + item.price, 0);

  const summaryH = 24;
  drawCardDark(doc, M, y, CONTENT_W, summaryH, { accent: false });
  rgb(doc, BRAND.green, 'fill');
  doc.rect(M, y, CONTENT_W, 1.5, 'F');

  const row1Y = y + 9;
  const row2Y = y + 17;

  opacity(doc, 0.5);
  rgb(doc, BRAND.grayMuted, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Valor base do container', M + 8, row1Y);
  opacity(doc, 1);
  rgb(doc, BRAND.grayLight, 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(quote.basePrice), PAGE_W - M - 6, row1Y, { align: 'right' });

  opacity(doc, 0.5);
  rgb(doc, BRAND.grayMuted, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Personalizacoes selecionadas', M + 8, row2Y);
  opacity(doc, 1);
  rgb(doc, BRAND.grayLight, 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(itemsTotal), PAGE_W - M - 6, row2Y, { align: 'right' });

  y += summaryH + 6;

  const totalH = 36;
  rgb(doc, BRAND.green, 'fill');
  doc.rect(M, y, CONTENT_W, totalH, 'F');

  opacity(doc, 0.15);
  rgb(doc, BRAND.white, 'fill');
  doc.rect(M, y, CONTENT_W, 2, 'F');
  opacity(doc, 1);

  opacity(doc, 0.15);
  rgb(doc, BRAND.dark, 'fill');
  doc.rect(M, y + totalH - 2, CONTENT_W, 2, 'F');
  opacity(doc, 1);

  opacity(doc, 0.6);
  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTIMENTO TOTAL', M + 10, y + 11);
  opacity(doc, 1);

  if (isAluguel) {
    opacity(doc, 0.45);
    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Locacao mensal', M + 10, y + 17);
    opacity(doc, 1);
  }

  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const totalStr = formatBRL(quote.totalPrice) + (isAluguel ? '/mes' : '');
  doc.text(totalStr, PAGE_W - M - 8, y + 24, { align: 'right' });

  y += totalH + 6;

  opacity(doc, 0.5);
  rgb(doc, BRAND.grayMuted, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Proposta construida com base nas escolhas realizadas na calculadora.',
    M,
    y
  );
  opacity(doc, 1);

  return y + 6;
}
