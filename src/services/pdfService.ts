import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Quote } from '../types';
import { ContainerSize } from '../components/ContainerSizeSelector';
import { renderClientPage } from './pdf/pdfClientPage';
import { renderBudgetPages } from './pdf/pdfBudgetPage';

export interface GenerateQuotePDFOptions {
  quote: Quote;
  selectedContainer?: ContainerSize | null;
}

const TEMPLATE_URL = '/proposta-template.pdf';

const CLIENT_PAGE_INDEX = 1;
const BUDGET_PAGE_INDEX = 4;

export const generateQuotePDF = async (
  quoteOrOptions: Quote | GenerateQuotePDFOptions,
  legacyContainer?: ContainerSize | null
): Promise<void> => {
  let quote: Quote;
  let selectedContainer: ContainerSize | null | undefined;

  if ('quote' in quoteOrOptions && quoteOrOptions.quote) {
    quote = quoteOrOptions.quote;
    selectedContainer = quoteOrOptions.selectedContainer;
  } else {
    quote = quoteOrOptions as Quote;
    selectedContainer = legacyContainer;
  }

  const templateBytes = await fetch(TEMPLATE_URL).then(res => {
    if (!res.ok) throw new Error(`Falha ao carregar template PDF: ${res.status}`);
    return res.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(templateBytes);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();

  const clientPage = pages[CLIENT_PAGE_INDEX];
  renderClientPage(clientPage, { quote, selectedContainer }, fontRegular, fontBold);

  renderBudgetPages(pdfDoc, BUDGET_PAGE_INDEX, { quote, selectedContainer }, fontRegular, fontBold);

  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Proposta Comercial Alencar (${quote.customer.name}).pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
