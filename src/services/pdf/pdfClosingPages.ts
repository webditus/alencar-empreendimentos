import jsPDF from 'jspdf';
import {
  BRAND, PAGE_W, PAGE_H, M, CONTENT_W,
  rgb, opacity, drawCardDark,
} from './pdfDrawUtils';
import {
  drawPageShell, drawPageTitle, drawPremiumCard,
} from './pdfPageComponents';

export function drawConditionsPage(doc: jsPDF, pageNum: number, totalPages: number) {
  drawPageShell(doc, pageNum, totalPages);

  let y = 28;

  opacity(doc, 0.4);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDICOES COMERCIAIS', M, y);
  opacity(doc, 1);
  y += 8;

  y = drawPageTitle(doc, 'Condicoes comerciais', y);
  y += 10;

  const conditions = [
    {
      title: 'Validade da proposta',
      body: 'Esta proposta possui validade comercial conforme a data de emissao e podera ser revisada apos esse periodo.',
    },
    {
      title: 'Condicoes de pagamento',
      body: 'As condicoes de pagamento serao alinhadas conforme escopo final, disponibilidade e formato de contratacao.',
    },
    {
      title: 'Prazo estimado',
      body: 'Os prazos podem variar de acordo com personalizacao, producao, logistica e definicao final do projeto.',
    },
    {
      title: 'Ajustes de projeto',
      body: 'Itens, acabamentos e composicoes podem ser ajustados para atender melhor a necessidade de uso.',
    },
    {
      title: 'Observacoes importantes',
      body: 'Valores e composicao apresentados consideram as selecoes realizadas ate esta etapa do orcamento.',
    },
  ];

  const cardW = CONTENT_W;
  const cardH = 30;
  const gap = 5;

  conditions.forEach((cond, i) => {
    const cy = y + i * (cardH + gap);

    drawCardDark(doc, M, cy, cardW, cardH, { accent: true, accentW: 2.5 });

    rgb(doc, BRAND.white, 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(cond.title, M + 10, cy + 11);

    opacity(doc, 0.6);
    rgb(doc, BRAND.grayLight, 'text');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(cond.body, cardW - 20);
    doc.text(lines, M + 10, cy + 19);
    opacity(doc, 1);
  });

  const afterConditions = y + conditions.length * (cardH + gap) + 6;

  opacity(doc, 0.3);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Para mais detalhes, entre em contato com nossa equipe comercial.',
    PAGE_W / 2,
    afterConditions,
    { align: 'center' }
  );
  opacity(doc, 1);
}

export function drawClosingPage(doc: jsPDF, pageNum: number, totalPages: number) {
  drawPageShell(doc, pageNum, totalPages);

  let y = 28;

  opacity(doc, 0.4);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PROXIMO PASSO', M, y);
  opacity(doc, 1);
  y += 8;

  y = drawPageTitle(doc, 'Seu projeto pode', y);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('comecar agora', M, y);
  y += 12;

  opacity(doc, 0.6);
  rgb(doc, BRAND.grayLight, 'text');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const intro1 = 'Se esta configuracao faz sentido para o seu momento, o proximo passo e simples.';
  const intro2 = 'Nossa equipe pode ajustar detalhes, orientar a melhor composicao e conduzir voce ate a solucao ideal.';
  doc.text(intro1, M, y);
  y += 5;
  doc.text(intro2, M, y);
  opacity(doc, 1);
  y += 14;

  const ctaCards = [
    {
      title: 'Falar no WhatsApp',
      body: 'Para tirar duvidas e avancar no atendimento.',
      icon: 'W',
    },
    {
      title: 'Solicitar ajustes',
      body: 'Para revisar composicao, acabamentos ou condicoes.',
      icon: 'A',
    },
    {
      title: 'Seguir com a proposta',
      body: 'Para evoluir a negociacao com mais rapidez.',
      icon: 'S',
    },
  ];

  const ctaW = (CONTENT_W - 8) / 3;
  const ctaH = 54;

  ctaCards.forEach((cta, i) => {
    const cx = M + i * (ctaW + 4);
    drawPremiumCard(doc, {
      title: cta.title,
      body: cta.body,
      x: cx,
      y: y,
      w: ctaW,
      h: ctaH,
      iconChar: cta.icon,
    });
  });

  y += ctaH + 16;

  opacity(doc, 0.08);
  rgb(doc, BRAND.greenLight, 'draw');
  doc.setLineWidth(0.3);
  doc.line(M, y, M + CONTENT_W, y);
  opacity(doc, 1);
  y += 10;

  const contactCardH = 44;
  drawCardDark(doc, M, y, CONTENT_W, contactCardH, { accent: true, accentW: 3 });

  rgb(doc, BRAND.white, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Alencar Empreendimentos', M + 10, y + 12);

  const contactCol1 = M + 10;
  const contactCol2 = M + CONTENT_W * 0.4;
  const contactRowY = y + 22;

  const contacts = [
    { label: 'WHATSAPP', value: '(11) 93499-1883', x: contactCol1 },
    { label: 'E-MAIL', value: 'contato@alencarempreendimentos.com.br', x: contactCol2 },
  ];

  contacts.forEach(c => {
    opacity(doc, 0.4);
    rgb(doc, BRAND.greenLight, 'text');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(c.label, c.x, contactRowY);
    opacity(doc, 1);

    rgb(doc, BRAND.grayLight, 'text');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(c.value, c.x, contactRowY + 6);
  });

  y += contactCardH + 16;

  opacity(doc, 0.35);
  rgb(doc, BRAND.greenLight, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Precisao, tecnologia e construcao inteligente.',
    PAGE_W / 2,
    y,
    { align: 'center' }
  );
  opacity(doc, 1);

  rgb(doc, BRAND.green, 'fill');
  doc.rect(0, PAGE_H - 20, PAGE_W, 8, 'F');
  opacity(doc, 0.08);
  rgb(doc, BRAND.greenLight, 'fill');
  doc.rect(0, PAGE_H - 20, PAGE_W, 8, 'F');
  opacity(doc, 1);
}
