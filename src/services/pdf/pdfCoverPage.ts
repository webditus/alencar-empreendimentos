import jsPDF from 'jspdf';
import {
  BRAND, RGB, PAGE_W, PAGE_H, M, CONTENT_W,
  rgb, opacity, drawDarkPage, drawBadge,
} from './pdfDrawUtils';

export interface CoverData {
  operationType: 'venda' | 'aluguel';
  customerName: string;
  city: string;
  proposalNumber: string;
  emissionDate: string;
}

export function drawCoverPage(doc: jsPDF, data: CoverData) {
  const isAluguel = data.operationType === 'aluguel';

  drawDarkPage(doc);

  drawCoverBackground(doc);
  drawCoverAccents(doc);
  drawCoverLogo(doc);
  drawCoverBadge(doc, isAluguel);
  drawCoverTitle(doc, isAluguel);
  drawCoverClientInfo(doc, data);
  drawCoverBrandLine(doc);
  drawCoverFooter(doc);
}

function drawCoverBackground(doc: jsPDF) {
  rgb(doc, BRAND.darkMid, 'fill');
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.48, 'F');

  rgb(doc, BRAND.green, 'fill');
  doc.rect(0, 0, 5, PAGE_H, 'F');

  opacity(doc, 0.04);
  rgb(doc, BRAND.greenLight, 'fill');
  for (let i = 0; i < 20; i++) {
    const x = 5 + i * 10.5;
    doc.rect(x, 0, 5.5, PAGE_H * 0.48, 'F');
  }
  opacity(doc, 1);

  opacity(doc, 0.05);
  rgb(doc, BRAND.greenLight, 'fill');
  const cx = PAGE_W * 0.72;
  const cy = PAGE_H * 0.22;
  doc.circle(cx, cy, 100, 'F');
  doc.circle(cx + 30, cy - 20, 60, 'F');
  opacity(doc, 1);

  opacity(doc, 0.03);
  rgb(doc, BRAND.white, 'fill');
  doc.triangle(PAGE_W * 0.45, 0, PAGE_W, 0, PAGE_W, PAGE_H * 0.25, 'F');
  opacity(doc, 1);

  rgb(doc, BRAND.green, 'fill');
  doc.rect(5, PAGE_H * 0.48, PAGE_W - 5, 2.5, 'F');

  opacity(doc, 0.08);
  rgb(doc, BRAND.greenLight, 'fill');
  doc.rect(5, PAGE_H * 0.48 + 2.5, PAGE_W - 5, 0.8, 'F');
  opacity(doc, 1);

  opacity(doc, 0.02);
  rgb(doc, BRAND.greenLight, 'fill');
  for (let i = 0; i < 6; i++) {
    const bx = 30 + i * 30;
    const by = PAGE_H * 0.52 + i * 12;
    doc.triangle(bx, by + 40, bx + 35, by, bx + 70, by + 40, 'F');
  }
  opacity(doc, 1);

  opacity(doc, 0.08);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.25);
  doc.circle(PAGE_W * 0.5, PAGE_H * 0.23, 70, 'D');
  opacity(doc, 0.05);
  doc.circle(PAGE_W * 0.5, PAGE_H * 0.23, 55, 'D');
  opacity(doc, 1);
}

function drawCoverAccents(doc: jsPDF) {
  opacity(doc, 0.1);
  rgb(doc, BRAND.green, 'fill');
  doc.rect(PAGE_W - 40, 0, 40, 4, 'F');
  opacity(doc, 1);
}

function drawCoverLogo(doc: jsPDF) {
  try {
    doc.addImage('/logotipo-alencar-empreendimentos-horizontal.webp', 'WEBP', M, 26, 66, 16);
  } catch {
    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ALENCAR EMPREENDIMENTOS', M, 37);
  }
}

function drawCoverBadge(doc: jsPDF, isAluguel: boolean) {
  const badgeLabel = isAluguel ? 'LOCACAO' : 'VENDA';
  const badgeColor: RGB = isAluguel ? BRAND.greenLight : BRAND.gold;
  drawBadge(doc, badgeLabel, PAGE_W - M - 40, 28, badgeColor);
}

function drawCoverTitle(doc: jsPDF, isAluguel: boolean) {
  const titleY = PAGE_H * 0.28;

  opacity(doc, 0.4);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA COMERCIAL', M, titleY);
  opacity(doc, 1);

  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('Proposta', M, titleY + 14);

  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  const dynamicWord = isAluguel ? 'de Locacao' : 'de Venda';
  doc.text(dynamicWord, M, titleY + 27);

  opacity(doc, 0.55);
  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const subtitle = isAluguel
    ? 'Container personalizado para locacao'
    : 'Container modular personalizado';
  doc.text(subtitle, M, titleY + 37);
  opacity(doc, 1);
}

function drawCoverClientInfo(doc: jsPDF, data: CoverData) {
  const infoY = PAGE_H * 0.55;

  const col1 = M + 10;
  const col2 = PAGE_W / 2 + 5;

  const labels: Array<{ label: string; value: string; x: number; y: number }> = [
    { label: 'CLIENTE', value: data.customerName, x: col1, y: infoY },
    { label: 'CIDADE', value: data.city || 'A definir', x: col2, y: infoY },
    { label: 'DATA DE EMISSAO', value: data.emissionDate, x: col1, y: infoY + 20 },
    { label: 'PROPOSTA N.', value: data.proposalNumber, x: col2, y: infoY + 20 },
  ];

  labels.forEach(({ label, value, x, y }) => {
    opacity(doc, 0.4);
    rgb(doc, BRAND.greenLight, 'text');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, y);
    opacity(doc, 1);

    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '', x, y + 6.5);
  });

  rgb(doc, BRAND.green, 'fill');
  doc.rect(col1, infoY + 34, CONTENT_W - 20, 0.4, 'F');
}

function drawCoverBrandLine(doc: jsPDF) {
  const brandY = PAGE_H * 0.76;

  opacity(doc, 0.35);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Precisao, tecnologia e construcao inteligente.', M + 10, brandY);
  opacity(doc, 1);

  const cardX = M + 10;
  const cardY = brandY + 10;
  const cardW = (CONTENT_W - 20) / 3 - 4;

  const infoItems = [
    { label: 'EMPRESA', value: 'Alencar Empreendimentos' },
    { label: 'CONTATO', value: 'contato@alencarempreendimentos.com.br' },
    { label: 'WHATSAPP', value: '(11) 93499-1883' },
  ];

  infoItems.forEach((item, i) => {
    const ix = cardX + i * (cardW + 6);
    opacity(doc, 0.4);
    rgb(doc, BRAND.greenLight, 'text');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, ix, cardY);
    opacity(doc, 1);

    rgb(doc, BRAND.grayLight, 'text');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(item.value, cardW);
    doc.text(lines, ix, cardY + 5);
  });
}

function drawCoverFooter(doc: jsPDF) {
  rgb(doc, BRAND.green, 'fill');
  doc.rect(5, PAGE_H - 20, PAGE_W - 5, 20, 'F');

  opacity(doc, 0.7);
  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Proposta gerada em ${new Date().toLocaleDateString('pt-BR')}`,
    PAGE_W / 2,
    PAGE_H - 8,
    { align: 'center' }
  );
  opacity(doc, 1);
}
