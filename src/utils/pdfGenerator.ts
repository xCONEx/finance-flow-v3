
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

const addHeader = (doc: jsPDF, title: string, userData: any, pageWidth: number, margin: number) => {
  // Background azul do cabeçalho
  doc.setFillColor(69, 123, 248); // Azul
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Título principal em branco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(title, margin, 25);
  
  // Data e número do orçamento
  const today = new Date().toLocaleDateString('pt-BR');
  const docNumber = Math.floor(Math.random() * 9999);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Data: ${today}`, pageWidth - 80, 20);
  doc.text(`Nº: ${docNumber}`, pageWidth - 80, 32);
  
  return 50; // Retorna Y position após o header
};

const addSection = (doc: jsPDF, title: string, x: number, y: number, pageWidth: number, margin: number) => {
  doc.setFillColor(69, 123, 248);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  
  // Background da seção
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
  doc.text(title, margin + 3, y + 6);
  
  return y + 15;
};

const addCompanyData = (doc: jsPDF, userData: any, startY: number, margin: number, pageWidth: number) => {
  let currentY = addSection(doc, 'DADOS DA EMPRESA', margin, startY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  
  const companyName = userData?.personalInfo?.company || userData?.company || 'Sua Empresa';
  const email = userData?.email || 'contato@empresa.com';
  const phone = userData?.personalInfo?.phone || 'Telefone não informado';
  
  doc.text(`Email: ${email}`, margin, currentY);
  doc.text(`Telefone: ${phone}`, margin, currentY + 8);
  
  return currentY + 24;
};

const addClientData = (doc: jsPDF, job: Job, startY: number, margin: number, pageWidth: number) => {
  let currentY = addSection(doc, 'DADOS DO CLIENTE', margin, startY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  
  doc.text(`Cliente: ${job.client || 'Cliente não informado'}`, margin, currentY);
  doc.text(`Descrição: ${job.description || 'Não informado'}`, margin, currentY + 8);
  doc.text(`Data do Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`, margin, currentY + 16);
  doc.text(`Categoria: ${job.category || 'Não informado'}`, margin, currentY + 24);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY + 32);
  
  return currentY + 48;
};

const addProposal = (doc: jsPDF, startY: number, margin: number, pageWidth: number) => {
  let currentY = addSection(doc, 'NOSSA PROPOSTA PARA VOCÊ', margin, startY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  
  const proposalText = [
    'É com grande satisfação que apresentamos nossa proposta personalizada para suas',
    'necessidades. Nossa empresa se destaca pela qualidade excepcional, atendimento diferenciado e',
    'compromisso com a excelência em cada projeto que realizamos.',
    '',
    'Confiamos que nossa proposta atenderá perfeitamente às suas expectativas, oferecendo a melhor',
    'relação custo-benefício do mercado. Estamos prontos para transformar sua visão em realidade',
    'com todo o profissionalismo que você merece.'
  ];
  
  proposalText.forEach((line, index) => {
    doc.text(line, margin, currentY + (index * 6));
  });
  
  return currentY + (proposalText.length * 6) + 15;
};

const checkPageBreak = (doc: jsPDF, currentY: number, neededSpace: number = 30) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - 20) {
    doc.addPage();
    return 20; // Nova posição Y no topo da nova página
  }
  return currentY;
};

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF do job:', job);
  console.log('👤 Dados do usuário:', userData);
  
  // Header
  let currentY = addHeader(doc, 'ORÇAMENTO', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, currentY, margin, pageWidth);
  
  // Verificar quebra de página
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Dados do cliente
  currentY = addClientData(doc, job, currentY, margin, pageWidth);
  
  // Verificar quebra de página
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Nossa proposta
  currentY = addProposal(doc, currentY, margin, pageWidth);
  
  // Verificar quebra de página
  currentY = checkPageBreak(doc, currentY, 100);
  
  // Detalhamento dos serviços
  currentY = addSection(doc, 'DETALHAMENTO DOS SERVIÇOS', margin, currentY, pageWidth, margin);
  
  // Cálculos
  const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
  const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
  const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
  const custoTotal = logistics + equipment + assistance;
  const desconto = (job.serviceValue * (job.discountValue || 0)) / 100;
  const valorComDesconto = job.serviceValue - desconto;
  
  console.log('💰 Valores calculados:', {
    logistics,
    equipment,
    assistance,
    custoTotal,
    serviceValue: job.serviceValue,
    discountValue: job.discountValue,
    desconto,
    valorComDesconto
  });
  
  // Tabela de serviços - removendo coluna PREÇO UNIT.
  const tableData = [
    ['Horas estimadas', `${job.estimatedHours || 0}h`, ''],
    ['Logística', '', logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Equipamentos', '', equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Assistência', '', assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Custo total', '', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Valor do serviço', '1', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
  ];
  
  if (job.discountValue && job.discountValue > 0) {
    tableData.push(['Desconto (%)', `${job.discountValue}%`, desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
    tableData.push(['', '', '']);
    tableData.push(['VALOR TOTAL COM DESCONTO', '', valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  }
  
  try {
    // Importar a extensão autoTable dinamicamente
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Usar a sintaxe correta do autoTable
    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO', 'QTD', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [69, 123, 248],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 100 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 50 }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didDrawPage: (data: any) => {
        // Se houver quebra de página, adicionar header novamente
        if (data.pageNumber > 1) {
          addHeader(doc, 'ORÇAMENTO (continuação)', userData, pageWidth, margin);
        }
      }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 100;
    
    // Verificar se precisa de nova página para o rodapé
    const footerY = checkPageBreak(doc, finalY, 30);
    
    // Rodapé
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Este orçamento é uma estimativa com base nas informações fornecidas.', margin, footerY + 15);
    doc.text('Validade: 30 dias a partir da data de emissão.', margin, footerY + 22);
    
  } catch (error) {
    console.error('❌ Erro ao gerar tabela do PDF:', error);
  }
  
  doc.save(`Orcamento_${job.client?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF de itens:', workItems);
  
  // Header
  let currentY = addHeader(doc, 'RELATÓRIO DE ITENS', userData, pageWidth, margin);
  
  // Informações do relatório (sem dados da empresa)
  currentY = addSection(doc, 'INFORMAÇÕES DO RELATÓRIO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de itens: ${workItems.length}`, margin, currentY + 8);
  
  currentY += 25;
  
  // Verificar quebra de página
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Detalhamento dos itens
  currentY = addSection(doc, 'DETALHAMENTO DOS ITENS DE TRABALHO', margin, currentY, pageWidth, margin);
  
  const tableData = workItems.map(item => [
    item.description,
    item.category,
    item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    `${item.depreciationYears || 5} anos`
  ]);
  
  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);
  tableData.push(['', '', '', '']);
  tableData.push(['VALOR TOTAL', '', totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '']);
  
  try {
    // Importar a extensão autoTable dinamicamente
    const { default: autoTable } = await import('jspdf-autotable');
    
    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO', 'CATEGORIA', 'VALOR', 'DEPRECIAÇÃO']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [69, 123, 248],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) {
          const newY = addHeader(doc, 'RELATÓRIO DE ITENS', userData, pageWidth, margin);
          // Ajustar startY para nova página
          if (data.table) {
            data.table.startY = newY;
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao gerar tabela:', error);
  }
  
  doc.save(`Itens_Trabalho_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF de despesas:', expenses);
  
  // Header
  let currentY = addHeader(doc, 'RELATÓRIO DE DESPESAS', userData, pageWidth, margin);
  
  // Informações do relatório (sem dados da empresa)
  currentY = addSection(doc, 'INFORMAÇÕES DO RELATÓRIO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de despesas: ${expenses.length}`, margin, currentY + 8);
  
  currentY += 25;
  
  // Verificar quebra de página
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Detalhamento das despesas
  currentY = addSection(doc, 'DETALHAMENTO DAS DESPESAS MENSAIS', margin, currentY, pageWidth, margin);
  
  const tableData = expenses.map(exp => [
    exp.description,
    exp.category,
    exp.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    new Date(exp.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  ]);
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);
  tableData.push(['', '', '', '']);
  tableData.push(['TOTAL DE DESPESAS', '', totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '']);
  
  try {
    // Importar a extensão autoTable dinamicamente
    const { default: autoTable } = await import('jspdf-autotable');
    
    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO', 'CATEGORIA', 'VALOR', 'MÊS/ANO']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [69, 123, 248],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) {
          const newY = addHeader(doc, 'RELATÓRIO DE DESPESAS', userData, pageWidth, margin);
          // Ajustar startY para nova página
          if (data.table) {
            data.table.startY = newY;
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao gerar tabela:', error);
  }
  
  doc.save(`Despesas_Mensais_${new Date().toISOString().slice(0, 10)}.pdf`);
};
