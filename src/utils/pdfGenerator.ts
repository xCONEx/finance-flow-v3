import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Job, WorkItem, MonthlyCost } from '../types';

// Declaração corrigida para autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const drawLine = (doc: jsPDF, y: number, margin: number, pageWidth: number) => {
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
};

const addLogoOrCompany = (doc: jsPDF, userData: any, pageWidth: number, margin: number, yPos: number) => {
  if (userData?.imageuser) {
    try {
      const maxWidth = 40;
      const maxHeight = 20;
      const x = pageWidth - maxWidth - margin;
      doc.addImage(userData.imageuser, 'PNG', x, yPos, maxWidth, maxHeight);
      return yPos + maxHeight + 10;
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }
  if (userData?.personalInfo?.company || userData?.company) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    const companyName = userData?.personalInfo?.company || userData?.company;
    const companyWidth = doc.getTextWidth(companyName);
    doc.text(companyName, pageWidth - companyWidth - margin, yPos + 10);
    return yPos + 20;
  }
  return yPos + 10;
};

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;
  const lineHeight = 8;

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(`Orçamento - ${job.client || 'Cliente'}`, margin, contentStartY);

  // Logo ou empresa
  contentStartY = addLogoOrCompany(doc, userData, pageWidth, margin, contentStartY);

  // Seção: Informações do Job
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Informações do Job', margin, contentStartY);
  drawLine(doc, contentStartY + 3, margin, pageWidth);
  contentStartY += 10;

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(`Descrição: ${job.description || 'Não informado'}`, margin, contentStartY + lineHeight * 1);
  doc.text(`Data do Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`, margin, contentStartY + lineHeight * 2);
  doc.text(`Categoria: ${job.category || 'Não informado'}`, margin, contentStartY + lineHeight * 3);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, contentStartY + lineHeight * 4);
  contentStartY += lineHeight * 5;

  // Cálculo de valores
  const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
  const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
  const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
  const custoTotal = logistics + equipment + assistance;
  const desconto = (job.serviceValue * (job.discountValue || 0)) / 100;
  const valorComDesconto = job.serviceValue - desconto;

// Seção: Valores
doc.setFontSize(14);
doc.setFont(undefined, 'bold');
doc.setTextColor(33, 37, 41);

// Títulos alinhados: "Descrição" na esquerda e "Valores" na direita
const descricaoTitle = 'Descrição';
const valoresTitle = 'Valores';

doc.text(descricaoTitle, margin, contentStartY);
const valoresTitleWidth = doc.getTextWidth(valoresTitle);
doc.text(valoresTitle, pageWidth - margin - valoresTitleWidth, contentStartY);

drawLine(doc, contentStartY + 3, margin, pageWidth);
contentStartY += 10;

// Tabela de valores, trocando o cabeçalho da segunda coluna para "Descrição"
const tableData = [
  ['Horas estimadas', `${job.estimatedHours || 0}h`],
  ['Logística', logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
  ['Equipamentos', equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
  ['Assistência', assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
  ['Custo total', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
  ['Valor do serviço', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
];

if (job.discountValue && job.discountValue > 0) {
  tableData.push(['Desconto (%)', `${job.discountValue}%`]);
  tableData.push(['Valor com desconto', valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
}

// Agora o autoTable só recebe o corpo (sem cabeçalho separado), pois o primeiro elemento já é cabeçalho
try {
  (doc as any).autoTable({
    startY: contentStartY,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontSize: 12,
    },
    bodyStyles: {
      fontSize: 11,
    },
    columnStyles: {
      1: { halign: 'right' }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || contentStartY + 200;
  drawLine(doc, finalY + 8, margin, pageWidth);
  doc.setFontSize(10);
  doc.setTextColor(130);
  doc.text('Este orçamento é uma estimativa com base nas informações fornecidas.', margin, finalY + 15);
} catch (error) {
  console.error('Erro ao gerar tabela do PDF:', error);
  // Fallback manual
  let currentY = contentStartY;
  doc.setFontSize(12);
  doc.setTextColor(0);
  tableData.forEach((row, index) => {
    const y = currentY + index * 8;
    doc.text(row[0], margin, y);
    doc.text(row[1], pageWidth - margin - doc.getTextWidth(row[1]), y);
  });
}

doc.save(`Orcamento_${job.client?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;
  const lineHeight = 8;

  // Logo ou empresa
  contentStartY = addLogoOrCompany(doc, userData, pageWidth, margin, contentStartY);

  // Título
  const title = 'Relatório de Itens de Trabalho';
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(title, margin, contentStartY);
  drawLine(doc, contentStartY + 3, margin, pageWidth);
  contentStartY += 12;

  // Info
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, contentStartY);
  doc.text(`Total de itens: ${workItems.length}`, margin, contentStartY + lineHeight);
  contentStartY += lineHeight * 2;

  // Preparar dados tabela
  const tableData = workItems.map(item => [
    item.description,
    item.category,
    item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    new Date().toLocaleDateString('pt-BR'),
  ]);

  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);

  doc.setFont(undefined, 'bold');
doc.setTextColor(33, 37, 41);

    const descricaoTitle = 'Descrição';
    

doc.text(descricaoTitle, margin, contentStartY);


drawLine(doc, contentStartY + 3, margin, pageWidth);
contentStartY += 10;

  try {
    (doc as any).autoTable({
      startY: contentStartY,
      head: [['Descrição', 'Categoria', 'Valor', 'Data']],
      body: [
        ...tableData,
        ['TOTAL', '', totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), ''],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontSize: 12,
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        2: { halign: 'right' }
      },
    });
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
    // Fallback manual
    let currentY = contentStartY;
    doc.setFontSize(10);
    doc.setTextColor(0);
    const colPositions = [margin, margin + 70, margin + 105, margin + 140];
    tableData.forEach((row, index) => {
      const y = currentY + index * 8;
      row.forEach((cell, i) => {
        if (i === 2) {
          // alinhamento direita para valores
          doc.text(cell, colPositions[i] + doc.getTextWidth(cell), y, { align: 'right' });
        } else {
          doc.text(cell, colPositions[i], y);
        }
      });
    });
  }

  doc.save(`Itens_Trabalho_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;
  const lineHeight = 8;

  // Logo ou empresa
  contentStartY = addLogoOrCompany(doc, userData, pageWidth, margin, contentStartY);

  // Título
  const title = 'Relatório de Despesas Mensais';
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(title, margin, contentStartY);
  drawLine(doc, contentStartY + 3, margin, pageWidth);
  contentStartY += 12;

  // Info
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, contentStartY);
  doc.text(`Total de despesas: ${expenses.length}`, margin, contentStartY + lineHeight);
  contentStartY += lineHeight * 2;

  // Preparar dados tabela
 const tableData = expenses.map(exp => [
  exp.description,
  exp.category,
  exp.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  new Date(exp.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);

doc.setFont(undefined, 'bold');
doc.setTextColor(33, 37, 41);

const descricaoTitle = 'Descrição';
    

doc.text(descricaoTitle, margin, contentStartY);


drawLine(doc, contentStartY + 3, margin, pageWidth);
contentStartY += 10;

  try {
    (doc as any).autoTable({
      startY: contentStartY,
      head: [['Descrição', 'Categoria', 'Valor', 'Data']],
      body: [
        ...tableData,
        ['TOTAL', '', totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), ''],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontSize: 12,
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        2: { halign: 'right' }
      },
    });
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
    // Fallback manual
    let currentY = contentStartY;
    doc.setFontSize(10);
    doc.setTextColor(0);
    const colPositions = [margin, margin + 70, margin + 105, margin + 140];
    tableData.forEach((row, index) => {
      const y = currentY + index * 8;
      row.forEach((cell, i) => {
        if (i === 2) {
          doc.text(cell, colPositions[i] + doc.getTextWidth(cell), y, { align: 'right' });
        } else {
          doc.text(cell, colPositions[i], y);
        }
      });
    });
  }

  doc.save(`Despesas_Mensais_${new Date().toISOString().slice(0, 10)}.pdf`);
};
