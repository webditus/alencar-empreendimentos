import jsPDF from 'jspdf';

export const BRAND = {
  dark: [6, 10, 19] as RGB,
  darkMid: [13, 43, 37] as RGB,
  darkCard: [10, 31, 26] as RGB,
  darkCardEnd: [13, 43, 37] as RGB,
  sidebarDark: [5, 29, 29] as RGB,
  green: [36, 82, 71] as RGB,
  greenHover: [58, 111, 99] as RGB,
  greenLight: [107, 149, 140] as RGB,
  mintBg: [230, 243, 238] as RGB,
  white: [255, 255, 255] as RGB,
  grayDark: [40, 48, 56] as RGB,
  grayMid: [100, 116, 128] as RGB,
  grayMuted: [148, 163, 172] as RGB,
  grayLight: [220, 230, 226] as RGB,
  grayFaint: [240, 244, 242] as RGB,
  gold: [212, 168, 80] as RGB,
  selectedBg: [6, 10, 19] as RGB,
  selectedBgEnd: [11, 19, 34] as RGB,
};

export type RGB = [number, number, number];

export const PAGE_W = 210;
export const PAGE_H = 297;
export const M = 20;
export const CONTENT_W = PAGE_W - M * 2;
export const COL_HALF = CONTENT_W / 2 - 3;

export function rgb(doc: jsPDF, color: RGB, type: 'fill' | 'text' | 'draw' = 'fill') {
  if (type === 'fill') doc.setFillColor(color[0], color[1], color[2]);
  else if (type === 'text') doc.setTextColor(color[0], color[1], color[2]);
  else doc.setDrawColor(color[0], color[1], color[2]);
}

export function opacity(doc: jsPDF, val: number) {
  doc.setGState(doc.GState({ opacity: val }));
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function drawDarkPage(doc: jsPDF) {
  rgb(doc, BRAND.dark, 'fill');
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

export function drawGreenLeftAccent(doc: jsPDF, y: number, h: number, width = 3) {
  rgb(doc, BRAND.green, 'fill');
  doc.rect(M, y, width, h, 'F');
}

export function drawCardDark(doc: jsPDF, x: number, y: number, w: number, h: number, opts?: { radius?: number; accent?: boolean; accentW?: number }) {
  const r = opts?.radius ?? 0;
  rgb(doc, BRAND.darkCard, 'fill');
  if (r > 0) {
    doc.roundedRect(x, y, w, h, r, r, 'F');
  } else {
    doc.rect(x, y, w, h, 'F');
  }
  rgb(doc, BRAND.darkMid, 'fill');
  if (r > 0) {
    doc.roundedRect(x, y, w, h, r, r, 'F');
  } else {
    doc.rect(x, y, w, h, 'F');
  }

  opacity(doc, 0.1);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.4);
  if (r > 0) {
    doc.roundedRect(x, y, w, h, r, r, 'D');
  } else {
    doc.rect(x, y, w, h, 'D');
  }
  opacity(doc, 1);

  if (opts?.accent !== false) {
    rgb(doc, BRAND.green, 'fill');
    doc.rect(x, y + (r > 0 ? r : 0), opts?.accentW ?? 3, h - (r > 0 ? r * 2 : 0), 'F');
  }
}

export function drawCardLight(doc: jsPDF, x: number, y: number, w: number, h: number, opts?: { radius?: number; accent?: boolean }) {
  const r = opts?.radius ?? 0;
  rgb(doc, BRAND.mintBg, 'fill');
  if (r > 0) {
    doc.roundedRect(x, y, w, h, r, r, 'F');
  } else {
    doc.rect(x, y, w, h, 'F');
  }
  if (opts?.accent !== false) {
    rgb(doc, BRAND.green, 'fill');
    doc.rect(x, y + (r > 0 ? r : 0), 3, h - (r > 0 ? r * 2 : 0), 'F');
  }
}

export function drawBadge(doc: jsPDF, label: string, x: number, y: number, color: RGB, textColor: RGB = BRAND.dark) {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const tw = doc.getTextWidth(label);
  const pw = tw + 10;
  const ph = 10;
  rgb(doc, color, 'fill');
  doc.roundedRect(x, y, pw, ph, 3, 3, 'F');
  rgb(doc, textColor, 'text');
  doc.text(label, x + pw / 2, y + 6.5, { align: 'center' });
  return pw;
}

export function drawSectionLabel(doc: jsPDF, label: string, y: number): number {
  rgb(doc, BRAND.green, 'fill');
  doc.rect(M, y, 3, 8, 'F');
  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), M + 7, y + 5.5);
  opacity(doc, 0.08);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.3);
  doc.line(M, y + 10, M + CONTENT_W, y + 10);
  opacity(doc, 1);
  return y + 16;
}

export function drawFieldLabel(doc: jsPDF, label: string, value: string, x: number, y: number, maxW?: number) {
  opacity(doc, 0.5);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), x, y);
  opacity(doc, 1);
  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const val = value || 'Nao informado';
  if (maxW) {
    const lines = doc.splitTextToSize(val, maxW);
    doc.text(lines[0] || val, x, y + 5);
  } else {
    doc.text(val, x, y + 5);
  }
}

export function drawHorizontalDivider(doc: jsPDF, y: number) {
  opacity(doc, 0.08);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.3);
  doc.line(M, y, M + CONTENT_W, y);
  opacity(doc, 1);
}
