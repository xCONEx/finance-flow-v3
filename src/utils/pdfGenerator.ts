import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const addHeader = (doc: jsPDF, title: string, userData: any, pageWidth: number, margin: number) => {
  // Background azul do cabeçalho
  doc.setFillColor(69, 123, 248);
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
  
  const companyName = userData?.company || 'Nome da empresa não informado';
  const email = userData?.email || 'Email não informado';
  
  doc.text(`Empresa: ${companyName}`, margin, currentY);
  doc.text(`Email: ${email}`, margin, currentY + 8);
  
  return currentY + 25;
};

export const generateJobPDF = async (job: any, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF do job:', job);
  
  // Header
  let currentY = addHeader(doc, 'ORÇAMENTO', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, margin, currentY, pageWidth);
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Dados do cliente
  currentY = addSection(doc, 'DADOS DO CLIENTE', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Cliente: ${job.client || 'Não informado'}`, margin, currentY);
  doc.text(`Descrição: ${job.description}`, margin, currentY + 8);
  doc.text(`Data do evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`, margin, currentY + 16);
  doc.text(`Status: ${job.status}`, margin, currentY + 24);
  if (job.category) {
    doc.text(`Categoria: ${job.category}`, margin, currentY + 32);
    currentY += 8;
  }
  
  currentY += 48;
  currentY = checkPageBreak(doc, currentY, 80);
  
  // Itens do orçamento
  currentY = addSection(doc, 'ITENS DO ORÇAMENTO', margin, currentY, pageWidth, margin);
  
  const tableData = [];
  
  // Adicionar linha do serviço principal
  const serviceDescription = job.description || 'Serviço de vídeo';
  const total = job.serviceValue || 0;
  
  tableData.push([
    serviceDescription,
    total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  ]);
  
  // Adicionar custos extras se existirem
  if (job.logistics > 0) {
    tableData.push([
      'Logística',
      job.logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]);
  }
  
  if (job.equipment > 0) {
    tableData.push([
      'Equipamentos',
      job.equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]);
  }
  
  if (job.assistance > 0) {
    tableData.push([
      'Assistência',
      job.assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]);
  }
  
  const subtotal = job.totalCosts || job.serviceValue || 0;
  const finalValue = job.valueWithDiscount || job.totalCosts || job.serviceValue || 0;
  
  // Linha de subtotal
  tableData.push(['', '']);
  tableData.push(['Subtotal:', subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  
  // Desconto se houver
  if (job.discountValue > 0) {
    tableData.push(['Desconto:', `-${job.discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`]);
  }
  
  // Total final
  tableData.push(['TOTAL FINAL:', finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  
  try {
    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO', 'TOTAL']],
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
          addHeader(doc, 'ORÇAMENTO', userData, pageWidth, margin);
        }
      }
    });
    
    // Condições especiais
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    let conditionsY = checkPageBreak(doc, finalY, 40);
    
    conditionsY = addSection(doc, 'CONDIÇÕES ESPECIAIS', margin, conditionsY, pageWidth, margin);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Pagamento em até 30 dias após aprovação do orçamento.', margin, conditionsY);
    
  } catch (error) {
    console.error('❌ Erro ao gerar tabela:', error);
  }
  
  doc.save(`Orcamento_${job.description.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: any[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF de itens:', workItems);
  
  // Header
  let currentY = addHeader(doc, 'RELATÓRIO DE ITENS', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, margin, currentY, pageWidth);
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Informações do relatório
  currentY = addSection(doc, 'INFORMAÇÕES DO RELATÓRIO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de itens: ${workItems.length}`, margin, currentY + 8);
  
  currentY += 25;
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
          addHeader(doc, 'RELATÓRIO DE ITENS', userData, pageWidth, margin);
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao gerar tabela:', error);
  }
  
  doc.save(`Itens_Trabalho_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateExpensesPDF = async (expenses: any[], userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  
  console.log('🔍 Gerando PDF de despesas:', expenses);
  
  // Header
  let currentY = addHeader(doc, 'RELATÓRIO DE DESPESAS', userData, pageWidth, margin);
  
  // Dados da empresa
  currentY = addCompanyData(doc, userData, margin, currentY, pageWidth);
  currentY = checkPageBreak(doc, currentY, 60);
  
  // Informações do relatório
  currentY = addSection(doc, 'INFORMAÇÕES DO RELATÓRIO', margin, currentY, pageWidth, margin);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
  doc.text(`Total de despesas: ${expenses.length}`, margin, currentY + 8);
  
  currentY += 25;
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
          addHeader(doc, 'RELATÓRIO DE DESPESAS', userData, pageWidth, margin);
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao gerar tabela:', error);
  }
  
  doc.save(`Despesas_Mensais_${new Date().toISOString().slice(0, 10)}.pdf`);
};
