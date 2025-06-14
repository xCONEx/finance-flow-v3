
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
  const address = userData?.personalInfo?.address || 'Endereço não informado';
  
  doc.text(`Empresa: ${companyName}`, margin, currentY);
  doc.text(`Email: ${email}`, margin, currentY + 8);
  doc.text(`Telefone: ${phone}`, margin, currentY + 16);
  doc.text(`Endereço: ${address}`, margin, currentY + 24);
  
  return currentY + 40;
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

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  // Header
  let currentY = addHeader(doc, 'ORÇAMENTO', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, currentY, margin, pageWidth);
  
  // Dados do cliente
  currentY = addClientData(doc, job, currentY, margin, pageWidth);
  
  // Nossa proposta
  currentY = addProposal(doc, currentY, margin, pageWidth);
  
  // Detalhamento dos serviços
  currentY = addSection(doc, 'DETALHAMENTO DOS SERVIÇOS', margin, currentY, pageWidth, margin);
  
  // Cálculos
  const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
  const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
  const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
  const custoTotal = logistics + equipment + assistance;
  const desconto = (job.serviceValue * (job.discountValue || 0)) / 100;
  const valorComDesconto = job.serviceValue - desconto;
  
  // Tabela de serviços
  const tableData = [
    ['Horas estimadas', `${job.estimatedHours || 0}h`, '', ''],
    ['Logística', '', job.logistics ? job.logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00', ''],
    ['Equipamentos', '', job.equipment ? job.equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00', ''],
    ['Assistência', '', job.assistance ? job.assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00', ''],
    ['Custo total', '', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), ''],
    ['Valor do serviço', '1', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
  ];
  
  if (job.discountValue && job.discountValue > 0) {
    tableData.push(['Desconto (%)', '', `${job.discountValue}%`, desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
    tableData.push(['', '', '', '']);
    tableData.push(['VALOR TOTAL COM DESCONTO', '', '', valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  }
  
  try {
    (doc as any).autoTable({
      startY: currentY,
      head: [['DESCRIÇÃO', 'QTD', 'PREÇO UNIT.', 'TOTAL']],
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
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 40 }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 100;
    
    // Rodapé
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Este orçamento é uma estimativa com base nas informações fornecidas.', margin, finalY + 15);
    doc.text('Validade: 30 dias a partir da data de emissão.', margin, finalY + 22);
    
  } catch (error) {
    console.error('Erro ao gerar tabela do PDF:', error);
  }
  
  doc.save(`Orcamento_${job.client?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  // Header
  let currentY = addHeader(doc, 'RELATÓRIO DE ITENS', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, currentY, margin, pageWidth);
  
  // Informações do relatório
  currentY = addSection(doc, 'INFORMAÇÕES DO RELATÓRIO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de itens: ${workItems.length}`, margin, currentY + 8);
  
  currentY += 25;
  
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
    (doc as any).autoTable({
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
      }
    });
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
  }
  
  doc.save(`Itens_Trabalho_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  // Header
  let currentY = addHeader(doc, 'RELATÓRIO DE DESPESAS', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, currentY, margin, pageWidth);
  
  // Informações do relatório
  currentY = addSection(doc, 'INFORMAÇÕES DO RELATÓRIO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de despesas: ${expenses.length}`, margin, currentY + 8);
  
  currentY += 25;
  
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
    (doc as any).autoTable({
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
      }
    });
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
  }
  
  doc.save(`Despesas_Mensais_${new Date().toISOString().slice(0, 10)}.pdf`);
};
