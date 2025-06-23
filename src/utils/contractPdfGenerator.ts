
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

const addHeader = (doc: jsPDF, title: string, userData: any, pageWidth: number, margin: number) => {
  // Background azul do cabeçalho
  doc.setFillColor(69, 123, 248);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Título principal em branco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(title, margin, 25);
  
  // Data e número do contrato
  const today = new Date().toLocaleDateString('pt-BR');
  const docNumber = Math.floor(Math.random() * 9999);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Data: ${today}`, pageWidth - 80, 20);
  doc.text(`Nº: ${docNumber}`, pageWidth - 80, 32);
  
  return 50;
};

const addSection = (doc: jsPDF, title: string, x: number, y: number, pageWidth: number, margin: number) => {
  doc.setFillColor(69, 123, 248);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
  doc.text(title, margin + 3, y + 6);
  
  return y + 15;
};

const checkPageBreak = (doc: jsPDF, currentY: number, neededSpace: number = 30) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return currentY;
};

const addCompanyData = (doc: jsPDF, userData: any, margin: number, currentY: number, pageWidth: number) => {
  // Seção DADOS DA EMPRESA
  currentY = addSection(doc, 'DADOS DA EMPRESA', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  
  const companyName = userData?.company || userData?.full_name || 'Nome da empresa não informado';
  const email = userData?.email || 'Email não informado';
  
  doc.text(`Empresa: ${companyName}`, margin, currentY);
  doc.text(`Email: ${email}`, margin, currentY + 8);
  
  return currentY + 25;
};

export const generateContractPDF = async (contract: any, client: any, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF do contrato:', contract);
  
  // Header
  let currentY = addHeader(doc, 'CONTRATO', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, margin, currentY, pageWidth);
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Dados do cliente
  currentY = addSection(doc, 'DADOS DO CLIENTE', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Cliente: ${client.name || 'Não informado'}`, margin, currentY);
  if (client.email) {
    doc.text(`Email: ${client.email}`, margin, currentY + 8);
    currentY += 8;
  }
  if (client.phone) {
    doc.text(`Telefone: ${client.phone}`, margin, currentY + 8);
    currentY += 8;
  }
  if (client.cnpj) {
    doc.text(`CNPJ: ${client.cnpj}`, margin, currentY + 8);
    currentY += 8;
  }
  
  currentY += 25;
  currentY = checkPageBreak(doc, currentY, 80);
  
  // Detalhes do contrato
  currentY = addSection(doc, 'DETALHES DO CONTRATO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Título: ${contract.title}`, margin, currentY);
  
  if (contract.description) {
    doc.text(`Descrição: ${contract.description}`, margin, currentY + 8);
    currentY += 8;
  }
  
  doc.text(`Valor: ${formatCurrency(contract.value)}`, margin, currentY + 8);
  doc.text(`Status: ${contract.status}`, margin, currentY + 16);
  
  if (contract.start_date) {
    doc.text(`Data de início: ${new Date(contract.start_date).toLocaleDateString('pt-BR')}`, margin, currentY + 24);
    currentY += 8;
  }
  
  if (contract.end_date) {
    doc.text(`Data de término: ${new Date(contract.end_date).toLocaleDateString('pt-BR')}`, margin, currentY + 24);
    currentY += 8;
  }
  
  currentY += 40;
  currentY = checkPageBreak(doc, currentY, 80);
  
  // Resumo financeiro
  currentY = addSection(doc, 'RESUMO FINANCEIRO', margin, currentY, pageWidth, margin);
  
  const tableData = [
    ['Valor do Contrato', formatCurrency(contract.value)],
    ['Status', contract.status],
    ['Data de Criação', new Date(contract.created_at).toLocaleDateString('pt-BR')]
  ];
  
  try {
    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO', 'VALOR']],
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
        0: { halign: 'left', cellWidth: 120 },
        1: { halign: 'right', cellWidth: 60 }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) {
          addHeader(doc, 'CONTRATO', userData, pageWidth, margin);
        }
      }
    });
    
    // Termos e condições
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    let termsY = checkPageBreak(doc, finalY, 40);
    
    termsY = addSection(doc, 'TERMOS E CONDIÇÕES', margin, termsY, pageWidth, margin);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Este contrato está sujeito aos termos e condições acordados entre as partes.', margin, termsY);
    doc.text('Qualquer alteração deve ser feita por escrito e assinada por ambas as partes.', margin, termsY + 8);
    
  } catch (error) {
    console.error('❌ Erro ao gerar tabela:', error);
  }
  
  const fileName = `Contrato_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
