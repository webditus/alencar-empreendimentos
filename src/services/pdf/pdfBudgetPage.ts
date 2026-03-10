import { PDFDocument, PDFPage, PDFFont } from 'pdf-lib';
import { Quote, Item } from '../../types';
import { ContainerSize } from '../../components/ContainerSizeSelector';
import {
  A4_W,
  A4_H,
  MARGIN_LEFT,
  MARGIN_BOTTOM,
  CONTENT_RIGHT,
  CONTENT_WIDTH,
  COLORS,
  formatBRL,
  drawAccentLine,
  drawDividerLine,
  textWidth,
} from './pdfConstants';

interface BudgetPageParams {
  quote: Quote;
  selectedContainer?: ContainerSize | null;
}

interface CategoryGroup {
  name: string;
  items: Item[];
}

const ITEM_ROW_H = 22;
const CATEGORY_HEADER_H = 28;
const SAFE_BOTTOM = MARGIN_BOTTOM + 10;
const TOTAL_BLOCK_H = 100;

function drawCategoryHeader(
  page: PDFPage,
  name: string,
  y: number,
  fontBold: PDFFont
): number {
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 2,
    width: 3,
    height: 14,
    color: COLORS.brightGreen,
  });

  page.drawText(name.toUpperCase(), {
    x: MARGIN_LEFT + 10,
    y,
    size: 9,
    font: fontBold,
    color: COLORS.brightGreen,
  });

  return y - CATEGORY_HEADER_H;
}

function drawItemRow(
  page: PDFPage,
  itemName: string,
  price: string,
  y: number,
  fontRegular: PDFFont,
  fontBold: PDFFont
): number {
  page.drawText(itemName, {
    x: MARGIN_LEFT + 10,
    y,
    size: 10,
    font: fontRegular,
    color: COLORS.mutedWhite,
  });

  const priceW = textWidth(fontBold, price, 10);
  page.drawText(price, {
    x: CONTENT_RIGHT - priceW,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.mutedGreen,
  });

  drawDividerLine(page, y - 8);

  return y - ITEM_ROW_H;
}

function createOverflowPage(pdfDoc: PDFDocument, insertIndex: number): PDFPage {
  const newPage = pdfDoc.insertPage(insertIndex, [A4_W, A4_H]);
  newPage.drawRectangle({
    x: 0,
    y: 0,
    width: A4_W,
    height: A4_H,
    color: COLORS.pageBg,
  });
  return newPage;
}

function categoryHeight(items: Item[]): number {
  return CATEGORY_HEADER_H + items.length * ITEM_ROW_H;
}

function drawTotalBlock(
  page: PDFPage,
  basePrice: number,
  itemsTotal: number,
  grandTotal: number,
  isRental: boolean,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  y: number
) {
  y -= 10;

  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 2,
    width: 3,
    height: 14,
    color: COLORS.brightGreen,
  });
  page.drawText('RESUMO DO INVESTIMENTO', {
    x: MARGIN_LEFT + 10,
    y,
    size: 9,
    font: fontBold,
    color: COLORS.brightGreen,
  });

  y -= 28;

  page.drawText('Container base', {
    x: MARGIN_LEFT + 10,
    y,
    size: 10,
    font: fontRegular,
    color: COLORS.grayMuted,
  });
  const basePriceStr = formatBRL(basePrice);
  const bpW = textWidth(fontBold, basePriceStr, 10);
  page.drawText(basePriceStr, {
    x: CONTENT_RIGHT - bpW,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.white,
  });

  y -= 22;

  page.drawText('Itens adicionais', {
    x: MARGIN_LEFT + 10,
    y,
    size: 10,
    font: fontRegular,
    color: COLORS.grayMuted,
  });
  const itemsTotalStr = formatBRL(itemsTotal);
  const itW = textWidth(fontBold, itemsTotalStr, 10);
  page.drawText(itemsTotalStr, {
    x: CONTENT_RIGHT - itW,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.white,
  });

  y -= 20;

  page.drawRectangle({
    x: MARGIN_LEFT,
    y,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLORS.tealGreen,
    opacity: 0.4,
  });

  y -= 22;

  page.drawText('INVESTIMENTO TOTAL', {
    x: MARGIN_LEFT,
    y,
    size: 9.5,
    font: fontBold,
    color: COLORS.brightGreen,
  });

  y -= 28;

  const suffix = isRental ? ' /m\u00eas' : '';
  const totalStr = formatBRL(grandTotal) + suffix;
  const totalW = textWidth(fontBold, totalStr, 24);
  page.drawText(totalStr, {
    x: CONTENT_RIGHT - totalW,
    y,
    size: 24,
    font: fontBold,
    color: COLORS.white,
  });
}

export function renderBudgetPages(
  pdfDoc: PDFDocument,
  budgetPageIndex: number,
  params: BudgetPageParams,
  fontRegular: PDFFont,
  fontBold: PDFFont
): number {
  const { quote, selectedContainer } = params;
  const isRental = quote.operationType === 'aluguel';

  const itemsByCategory: Record<string, Item[]> = {};
  quote.selectedItems.forEach(item => {
    const cat = item.category || 'Outros';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });
  const categories: CategoryGroup[] = Object.entries(itemsByCategory).map(
    ([name, items]) => ({ name, items })
  );

  const basePrice = selectedContainer
    ? (isRental ? selectedContainer.aluguelPrice : selectedContainer.vendaPrice)
    : quote.basePrice;

  const itemsTotal = quote.selectedItems.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = quote.totalPrice || (basePrice + itemsTotal);

  let currentPage = pdfDoc.getPages()[budgetPageIndex];
  let currentInsertIndex = budgetPageIndex + 1;
  let pagesInserted = 0;

  let y = 790;

  currentPage.drawText('Resumo do projeto', {
    x: MARGIN_LEFT,
    y,
    size: 22,
    font: fontBold,
    color: COLORS.white,
  });

  y -= 14;
  drawAccentLine(currentPage, y, 300);

  y -= 30;

  currentPage.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 2,
    width: 3,
    height: 14,
    color: COLORS.brightGreen,
  });
  currentPage.drawText('CONTAINER BASE', {
    x: MARGIN_LEFT + 10,
    y,
    size: 9,
    font: fontBold,
    color: COLORS.brightGreen,
  });

  y -= CATEGORY_HEADER_H;

  const containerName = selectedContainer
    ? `Container ${selectedContainer.size}`
    : quote.containerType || 'Container';

  currentPage.drawText(containerName, {
    x: MARGIN_LEFT + 10,
    y,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  const basePriceLabel = formatBRL(basePrice) + (isRental ? ' /m\u00eas' : '');
  const bpW = textWidth(fontBold, basePriceLabel, 11);
  currentPage.drawText(basePriceLabel, {
    x: CONTENT_RIGHT - bpW,
    y,
    size: 11,
    font: fontBold,
    color: COLORS.mutedGreen,
  });

  if (selectedContainer?.description) {
    y -= 16;
    currentPage.drawText(selectedContainer.description, {
      x: MARGIN_LEFT + 10,
      y,
      size: 9,
      font: fontRegular,
      color: COLORS.grayMuted,
    });
  }

  y -= 20;
  drawDividerLine(currentPage, y);
  y -= 16;

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const needed = categoryHeight(cat.items);

    if (y - needed < SAFE_BOTTOM + TOTAL_BLOCK_H) {
      const newPage = createOverflowPage(pdfDoc, currentInsertIndex);
      currentInsertIndex++;
      pagesInserted++;
      currentPage = newPage;
      y = 790;
    }

    y = drawCategoryHeader(currentPage, cat.name, y, fontBold);

    for (let ii = 0; ii < cat.items.length; ii++) {
      const item = cat.items[ii];
      y = drawItemRow(
        currentPage,
        item.name,
        formatBRL(item.price),
        y,
        fontRegular,
        fontBold
      );

      if (y < SAFE_BOTTOM + TOTAL_BLOCK_H && (ii < cat.items.length - 1 || ci < categories.length - 1)) {
        const newPage = createOverflowPage(pdfDoc, currentInsertIndex);
        currentInsertIndex++;
        pagesInserted++;
        currentPage = newPage;
        y = 790;
      }
    }

    y -= 6;
  }

  if (y - TOTAL_BLOCK_H < SAFE_BOTTOM) {
    const newPage = createOverflowPage(pdfDoc, currentInsertIndex);
    currentInsertIndex++;
    pagesInserted++;
    currentPage = newPage;
    y = 790;
  }

  drawTotalBlock(
    currentPage,
    basePrice,
    itemsTotal,
    grandTotal,
    isRental,
    fontRegular,
    fontBold,
    y
  );

  return pagesInserted;
}
