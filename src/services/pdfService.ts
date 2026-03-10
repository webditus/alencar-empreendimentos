import jsPDF from 'jspdf';
import { Quote, Item } from '../types';
import { ContainerSize } from '../components/ContainerSizeSelector';
import { drawCoverPage } from './pdf/pdfCoverPage';
import { drawCommercialValuePage, drawDifferentialsPage } from './pdf/pdfValuePages';
import { drawBudgetPages } from './pdf/pdfBudgetPages';
import { drawConditionsPage, drawClosingPage } from './pdf/pdfClosingPages';

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

  const itemsByCategory: Record<string, Item[]> = {};
  quote.selectedItems.forEach(item => {
    const cat = item.category || 'Outros';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });
  const categoryNames = Object.keys(itemsByCategory);
  const totalItemLines = quote.selectedItems.length + categoryNames.length * 2;
  const budgetExtraPages = Math.max(0, Math.ceil((totalItemLines - 12) / 16));

  const TOTAL_PAGES = 6 + budgetExtraPages;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  drawCoverPage(doc, {
    operationType: quote.operationType,
    customerName: quote.customer.name,
    city: quote.customer.city
      ? `${quote.customer.city}/${quote.customer.state}`
      : '',
    proposalNumber: `#${quote.id.slice(-6).toUpperCase()}`,
    emissionDate: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  });

  doc.addPage();
  drawCommercialValuePage(doc, 2, TOTAL_PAGES);

  doc.addPage();
  drawDifferentialsPage(doc, 3, TOTAL_PAGES);

  doc.addPage();
  const lastBudgetPage = drawBudgetPages(
    doc,
    { quote, selectedContainer },
    4,
    TOTAL_PAGES
  );

  doc.addPage();
  drawConditionsPage(doc, lastBudgetPage + 1, TOTAL_PAGES);

  doc.addPage();
  drawClosingPage(doc, lastBudgetPage + 2, TOTAL_PAGES);

  doc.save(`Proposta_Alencar_${quote.customer.name.replace(/\s+/g, '_')}.pdf`);
};
