import jsPDF from 'jspdf';
import {
  BRAND, RGB, PAGE_W, PAGE_H, M, CONTENT_W,
  rgb, opacity, drawDarkPage, drawCardDark,
} from './pdfDrawUtils';

export function drawPageShell(doc: jsPDF, pageNum: number, totalPages: number) {
  drawDarkPage(doc);
  drawPageHeader(doc, pageNum, totalPages);
  drawPageFooter(doc);
}

function drawPageHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  rgb(doc, [4, 7, 14] as RGB, 'fill');
  doc.rect(0, 0, PAGE_W, 14, 'F');

  rgb(doc, BRAND.green, 'fill');
  doc.rect(0, 0, 3, 14, 'F');

  opacity(doc, 0.06);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.3);
  doc.line(0, 14, PAGE_W, 14);
  opacity(doc, 1);

  try {
    doc.addImage('/logotipo-alencar-empreendimentos-horizontal.webp', 'WEBP', 8, 2.5, 36, 9);
  } catch {
    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ALENCAR EMPREENDIMENTOS', 8, 9);
  }

  rgb(doc, BRAND.grayMuted, 'text');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, PAGE_W - M, 9, { align: 'right' });
}

function drawPageFooter(doc: jsPDF) {
  const footerY = PAGE_H - 12;
  rgb(doc, [4, 7, 14] as RGB, 'fill');
  doc.rect(0, footerY, PAGE_W, 12, 'F');

  rgb(doc, BRAND.green, 'fill');
  doc.rect(0, footerY, 3, 12, 'F');

  opacity(doc, 0.06);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.3);
  doc.line(0, footerY, PAGE_W, footerY);
  opacity(doc, 1);

  rgb(doc, BRAND.grayMuted, 'text');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('contato@alencarempreendimentos.com.br', M, footerY + 7);
  doc.text('(11) 93499-1883', PAGE_W / 2, footerY + 7, { align: 'center' });
  doc.text(
    new Date().toLocaleDateString('pt-BR'),
    PAGE_W - M,
    footerY + 7,
    { align: 'right' }
  );
}

export interface PremiumCardConfig {
  title: string;
  body: string;
  x: number;
  y: number;
  w: number;
  h: number;
  iconChar?: string;
}

export function drawPremiumCard(doc: jsPDF, cfg: PremiumCardConfig) {
  drawCardDark(doc, cfg.x, cfg.y, cfg.w, cfg.h, { radius: 4, accent: true, accentW: 2.5 });

  rgb(doc, BRAND.green, 'fill');
  doc.roundedRect(cfg.x + 8, cfg.y + 8, 18, 18, 3, 3, 'F');
  opacity(doc, 0.15);
  rgb(doc, BRAND.greenLight, 'fill');
  doc.roundedRect(cfg.x + 8, cfg.y + 8, 18, 18, 3, 3, 'F');
  opacity(doc, 1);

  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(cfg.iconChar || '+', cfg.x + 17, cfg.y + 19.5, { align: 'center' });

  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(cfg.title, cfg.x + 8, cfg.y + 34);

  opacity(doc, 0.6);
  rgb(doc, BRAND.grayLight, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(cfg.body, cfg.w - 16);
  doc.text(lines, cfg.x + 8, cfg.y + 41);
  opacity(doc, 1);
}

export function drawPageTitle(doc: jsPDF, title: string, y: number): number {
  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, M, y);
  return y + 10;
}

export function drawPageSubtitle(doc: jsPDF, text: string, y: number): number {
  opacity(doc, 0.5);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(text, M, y);
  opacity(doc, 1);
  return y + 8;
}

export function drawParagraph(doc: jsPDF, text: string, y: number, maxW?: number): number {
  opacity(doc, 0.7);
  rgb(doc, BRAND.grayLight, 'text');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, maxW ?? CONTENT_W);
  doc.text(lines, M, y);
  opacity(doc, 1);
  return y + lines.length * 4.5 + 3;
}
