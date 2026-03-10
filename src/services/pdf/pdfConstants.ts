import { rgb, PDFFont } from 'pdf-lib';

export const A4_W = 595.28;
export const A4_H = 841.89;

export const MARGIN_LEFT = 50;
export const MARGIN_RIGHT = 120;
export const MARGIN_TOP = 52;
export const MARGIN_BOTTOM = 120;

export const CONTENT_RIGHT = A4_W - MARGIN_RIGHT;
export const CONTENT_WIDTH = CONTENT_RIGHT - MARGIN_LEFT;
export const COL2_X = 310;

export const COLORS = {
  pageBg: rgb(0.024, 0.039, 0.075),
  white: rgb(1, 1, 1),
  mutedWhite: rgb(0.85, 0.87, 0.86),
  brightGreen: rgb(0.53, 0.87, 0.15),
  tealGreen: rgb(0.14, 0.32, 0.28),
  mutedGreen: rgb(0.42, 0.58, 0.55),
  grayMuted: rgb(0.58, 0.64, 0.67),
  darkText: rgb(0.024, 0.039, 0.075),
  divider: rgb(0.14, 0.32, 0.28),
};

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function drawAccentLine(page: import('pdf-lib').PDFPage, y: number, width: number) {
  page.drawRectangle({
    x: MARGIN_LEFT,
    y,
    width,
    height: 1.5,
    color: COLORS.tealGreen,
  });
}

export function drawDividerLine(page: import('pdf-lib').PDFPage, y: number) {
  page.drawRectangle({
    x: MARGIN_LEFT,
    y,
    width: CONTENT_WIDTH,
    height: 0.3,
    color: COLORS.tealGreen,
    opacity: 0.15,
  });
}

export function textWidth(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size);
}
