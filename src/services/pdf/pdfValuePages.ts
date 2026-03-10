import jsPDF from 'jspdf';
import {
  BRAND, PAGE_W, M, CONTENT_W,
  rgb, opacity,
} from './pdfDrawUtils';
import {
  drawPageShell, drawPremiumCard, drawPageTitle, drawPageSubtitle, drawParagraph,
} from './pdfPageComponents';

export function drawCommercialValuePage(doc: jsPDF, pageNum: number, totalPages: number) {
  drawPageShell(doc, pageNum, totalPages);

  let y = 28;

  opacity(doc, 0.4);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR COMERCIAL', M, y);
  opacity(doc, 1);
  y += 8;

  y = drawPageTitle(doc, 'Sua necessidade pede', y);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('uma solucao a altura', M, y);
  y += 14;

  y = drawParagraph(
    doc,
    'Cada projeto exige mais do que espaco. Exige agilidade, seguranca, acabamento e uma entrega bem pensada. A Alencar desenvolve solucoes em containers e estruturas modulares com foco em funcionalidade, apresentacao e confianca em cada etapa.',
    y,
    CONTENT_W * 0.85
  );
  y += 6;

  const cardW = (CONTENT_W - 6) / 2;
  const cardH = 54;
  const gap = 6;

  const cards = [
    {
      title: 'Agilidade real',
      body: 'Projetos pensados para reduzir tempo e acelerar sua operacao.',
      icon: 'A',
    },
    {
      title: 'Personalizacao inteligente',
      body: 'Cada estrutura e ajustada a sua necessidade de uso.',
      icon: 'P',
    },
    {
      title: 'Acabamento que valoriza',
      body: 'Mais cuidado visual, mais conforto e melhor apresentacao final.',
      icon: 'V',
    },
    {
      title: 'Atendimento proximo',
      body: 'Suporte consultivo para orientar a melhor escolha do inicio ao fim.',
      icon: 'S',
    },
  ];

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    drawPremiumCard(doc, {
      title: card.title,
      body: card.body,
      x: cx,
      y: cy,
      w: cardW,
      h: cardH,
      iconChar: card.icon,
    });
  });

  const afterCards = y + 2 * (cardH + gap) + 8;

  opacity(doc, 0.12);
  rgb(doc, BRAND.green, 'fill');
  doc.rect(M, afterCards, CONTENT_W, 0.4, 'F');
  opacity(doc, 1);

  opacity(doc, 0.35);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'A Alencar entrega solucoes prontas para funcionar.',
    PAGE_W / 2,
    afterCards + 8,
    { align: 'center' }
  );
  opacity(doc, 1);
}

export function drawDifferentialsPage(doc: jsPDF, pageNum: number, totalPages: number) {
  drawPageShell(doc, pageNum, totalPages);

  let y = 28;

  opacity(doc, 0.4);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DIFERENCIAIS', M, y);
  opacity(doc, 1);
  y += 8;

  y = drawPageTitle(doc, 'Por que este projeto gera', y);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('mais seguranca na decisao', M, y);
  y += 16;

  const cardW = (CONTENT_W - 6) / 2;
  const cardH = 52;
  const gap = 6;

  const differentials = [
    {
      title: 'Projeto mais agil',
      body: 'Menos espera, mais velocidade para colocar sua estrutura em uso.',
      icon: 'R',
    },
    {
      title: 'Solucao sob medida',
      body: 'Layout, composicao e itens ajustados ao seu cenario.',
      icon: 'M',
    },
    {
      title: 'Melhor aproveitamento',
      body: 'Cada escolha contribui para um resultado mais funcional.',
      icon: 'E',
    },
    {
      title: 'Acabamento superior',
      body: 'Mais cuidado nos detalhes que impactam uso e percepcao.',
      icon: 'Q',
    },
    {
      title: 'Processo organizado',
      body: 'Etapas claras para gerar mais controle e previsibilidade.',
      icon: 'O',
    },
    {
      title: 'Atendimento consultivo',
      body: 'A proposta evolui conforme sua necessidade, sem engessar o projeto.',
      icon: 'C',
    },
  ];

  differentials.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    drawPremiumCard(doc, {
      title: card.title,
      body: card.body,
      x: cx,
      y: cy,
      w: cardW,
      h: cardH,
      iconChar: card.icon,
    });
  });

  const afterCards = y + 3 * (cardH + gap) + 8;

  opacity(doc, 0.12);
  rgb(doc, BRAND.green, 'fill');
  doc.rect(M, afterCards, CONTENT_W, 0.4, 'F');
  opacity(doc, 1);

  opacity(doc, 0.35);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Mais do que vender containers, a Alencar entrega solucoes prontas para funcionar.',
    PAGE_W / 2,
    afterCards + 8,
    { align: 'center' }
  );
  opacity(doc, 1);
}
