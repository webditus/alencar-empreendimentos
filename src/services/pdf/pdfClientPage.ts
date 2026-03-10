import { PDFPage, PDFFont } from 'pdf-lib';
import { Quote } from '../../types';
import { ContainerSize } from '../../components/ContainerSizeSelector';
import {
  MARGIN_LEFT,
  CONTENT_RIGHT,
  CONTENT_WIDTH,
  COL2_X,
  COLORS,
  formatDateBR,
  drawAccentLine,
  drawDividerLine,
  textWidth,
} from './pdfConstants';

interface ClientPageParams {
  quote: Quote;
  selectedContainer?: ContainerSize | null;
}

function drawLabel(page: PDFPage, label: string, x: number, y: number, fontBold: PDFFont) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    size: 7.5,
    font: fontBold,
    color: COLORS.mutedGreen,
    opacity: 0.6,
  });
}

function drawValue(page: PDFPage, value: string, x: number, y: number, fontBold: PDFFont, maxWidth?: number) {
  const displayValue = value || 'N\u00e3o informado';
  let text = displayValue;
  if (maxWidth) {
    const charWidth = fontBold.widthOfTextAtSize('M', 12);
    const maxChars = Math.floor(maxWidth / charWidth);
    if (text.length > maxChars) {
      text = text.substring(0, maxChars - 3) + '...';
    }
  }
  page.drawText(text, {
    x,
    y,
    size: 12,
    font: fontBold,
    color: COLORS.white,
  });
}

function drawBadge(
  page: PDFPage,
  label: string,
  x: number,
  y: number,
  fontBold: PDFFont
) {
  const badgeText = label.toUpperCase();
  const tw = textWidth(fontBold, badgeText, 8.5);
  const paddingH = 12;
  const paddingV = 5;
  const badgeW = tw + paddingH * 2;
  const badgeH = 20;

  page.drawRectangle({
    x,
    y: y - paddingV,
    width: badgeW,
    height: badgeH,
    color: COLORS.brightGreen,
    borderColor: COLORS.brightGreen,
    borderWidth: 0,
  });

  page.drawText(badgeText, {
    x: x + paddingH,
    y: y + 3,
    size: 8.5,
    font: fontBold,
    color: COLORS.darkText,
  });
}

export function renderClientPage(
  page: PDFPage,
  params: ClientPageParams,
  fontRegular: PDFFont,
  fontBold: PDFFont
) {
  const { quote, selectedContainer } = params;
  const { customer } = quote;

  let y = 790;

  page.drawText('Dados do projeto', {
    x: MARGIN_LEFT,
    y,
    size: 22,
    font: fontBold,
    color: COLORS.white,
  });

  y -= 14;
  drawAccentLine(page, y, 300);

  y -= 32;
  drawLabel(page, 'Cliente', MARGIN_LEFT, y, fontBold);
  drawValue(page, customer.name, MARGIN_LEFT, y - 16, fontBold, 220);

  drawLabel(page, 'Telefone', COL2_X, y, fontBold);
  drawValue(page, customer.phone, COL2_X, y - 16, fontBold);

  y -= 46;
  drawDividerLine(page, y + 8);

  drawLabel(page, 'E-mail', MARGIN_LEFT, y, fontBold);
  drawValue(page, customer.email, MARGIN_LEFT, y - 16, fontBold, 220);

  drawLabel(page, 'CEP', COL2_X, y, fontBold);
  drawValue(page, customer.cep, COL2_X, y - 16, fontBold);

  y -= 46;
  drawDividerLine(page, y + 8);

  drawLabel(page, 'Endere\u00e7o do projeto', MARGIN_LEFT, y, fontBold);
  const fullAddress = [customer.address, customer.city, customer.state]
    .filter(Boolean)
    .join(', ');
  drawValue(page, fullAddress, MARGIN_LEFT, y - 16, fontBold, CONTENT_WIDTH);

  y -= 46;
  drawDividerLine(page, y + 8);

  drawLabel(page, 'Data prevista', MARGIN_LEFT, y, fontBold);
  drawValue(page, formatDateBR(customer.projectDate), MARGIN_LEFT, y - 16, fontBold);

  drawLabel(page, 'Finalidade de uso', COL2_X, y, fontBold);
  const purposeText = customer.purpose && customer.purpose.length > 0
    ? customer.purpose.join(', ')
    : '';
  drawValue(page, purposeText, COL2_X, y - 16, fontBold);

  y -= 46;
  drawDividerLine(page, y + 8);

  drawLabel(page, 'Tipo de opera\u00e7\u00e3o', MARGIN_LEFT, y, fontBold);
  const opLabel = quote.operationType === 'aluguel' ? 'Loca\u00e7\u00e3o' : 'Venda';
  drawBadge(page, opLabel, MARGIN_LEFT, y - 20, fontBold);

  drawLabel(page, 'Container escolhido', COL2_X, y, fontBold);
  const containerText = selectedContainer
    ? `${selectedContainer.size} - ${selectedContainer.description}`
    : quote.containerType || '';
  drawValue(page, containerText, COL2_X, y - 16, fontBold);
}
