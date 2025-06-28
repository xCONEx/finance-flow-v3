
import jsPDF from 'jspdf';

interface JobData {
  id: string;
  description: string;
  client: string;
  eventDate: string;
  estimatedHours: number;
  difficultyLevel: string;
  logistics: number;
  equipment: number;
  assistance: number;
  totalPrice: number;
  clientId?: string;
}

interface CompanyData {
  name?: string;
  email?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
}

interface ClientData {
  name?: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  address?: string;
}

interface ExpenseData {
  id?: string;
  description: string;
  value: number;
  category: string;
  month: string;
  dueDate?: string;
  client?: string;
  isRecurring?: boolean;
  installments?: number;
  currentInstallment?: number;
}

interface WorkItemData {
  id: string;
  description: string;
  category: string;
  value: number;
  depreciationYears?: number;
}

// Função melhorada para tratar valores seguros
const safeNumber = (value: any): number => {
  // Se for null ou undefined, retorna 0
  if (value == null) return 0;
  
  // Se já for um número válido, retorna ele
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  
  // Se for string, tenta converter
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d.,\-]/g, '');
    if (!cleanValue) return 0;
    
    // Substitui vírgula por ponto
    const normalizedValue = cleanValue.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
  }
  
  // Para qualquer outro tipo, retorna 0
  return 0;
};

// Função para formatar valores monetários de forma segura
const formatCurrency = (value: any): string => {
  const safeValue = safeNumber(value);
  return safeValue.toFixed(2);
};

export const generateJobPDF = async (
  job: JobData, 
  companyData?: CompanyData,
  clientData?: ClientData
) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Cores
  const primaryColor = [41, 128, 185]; // Azul
  const secondaryColor = [52, 73, 94]; // Cinza escuro
  const lightGray = [236, 240, 241]; // Cinza claro
  
  try {
    // Header - Título principal
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('ORÇAMENTO DE SERVIÇO', 105, 20, { align: 'center' });
    
    yPosition = 45;
    doc.setTextColor(0, 0, 0);
    
    // TABELA - DADOS DA EMPRESA
    if (companyData) {
      doc.setFillColor(...lightGray);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(12);
      doc.text('DADOS DA EMPRESA', 20, yPosition + 6);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const companyFields = [
        { label: 'Razão Social:', value: companyData.name || 'Não informado' },
        { label: 'E-mail:', value: companyData.email || 'Não informado' },
        { label: 'CNPJ:', value: companyData.cnpj || 'Não informado' },
        { label: 'Telefone:', value: companyData.phone || 'Não informado' },
        { label: 'Endereço:', value: companyData.address || 'Não informado' }
      ];
      
      companyFields.forEach(field => {
        doc.text(field.label, 20, yPosition);
        doc.text(field.value, 70, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }
    
    // TABELA - DADOS DO CLIENTE
    if (clientData) {
      doc.setFillColor(...lightGray);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(12);
      doc.text('DADOS DO CLIENTE', 20, yPosition + 6);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const clientFields = [
        { label: 'Nome/Razão Social:', value: clientData.name || 'Não informado' },
        { label: 'E-mail:', value: clientData.email || 'Não informado' },
        { label: 'Telefone:', value: clientData.phone || 'Não informado' },
        { label: 'CNPJ/CPF:', value: clientData.cnpj || 'Não informado' },
        { label: 'Endereço:', value: clientData.address || 'Não informado' }
      ];
      
      clientFields.forEach(field => {
        doc.text(field.label, 20, yPosition);
        doc.text(field.value, 70, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }
    
    // TABELA - DETALHES DO SERVIÇO
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.text('DETALHES DO SERVIÇO', 20, yPosition + 6);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const serviceFields = [
      { label: 'Descrição:', value: job.description || 'Não informado' },
      { label: 'Data do Evento:', value: job.eventDate ? new Date(job.eventDate).toLocaleDateString('pt-BR') : 'Não informado' },
      { label: 'Horas Estimadas:', value: `${safeNumber(job.estimatedHours)}h` },
      { label: 'Nível de Dificuldade:', value: job.difficultyLevel || 'Não informado' }
    ];
    
    serviceFields.forEach(field => {
      doc.text(field.label, 20, yPosition);
      doc.text(field.value, 70, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    
    // TABELA - COMPOSIÇÃO DE CUSTOS
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.text('COMPOSIÇÃO DE CUSTOS', 20, yPosition + 6);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const costFields = [
      { label: 'Logística:', value: `R$ ${formatCurrency(job.logistics)}` },
      { label: 'Equipamentos:', value: `R$ ${formatCurrency(job.equipment)}` },
      { label: 'Assistência:', value: `R$ ${formatCurrency(job.assistance)}` }
    ];
    
    costFields.forEach(field => {
      doc.text(field.label, 20, yPosition);
      doc.text(field.value, 70, yPosition);
      yPosition += 6;
    });
    
    yPosition += 15;
    
    // VALOR TOTAL - Destacado
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPosition, 180, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('VALOR TOTAL:', 20, yPosition + 10);
    doc.text(`R$ ${formatCurrency(job.totalPrice)}`, 150, yPosition + 10);
    
    yPosition += 25;
    
    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Orçamento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition + 10);
    
    // Gerar PDF
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Abrir em nova aba
    window.open(pdfUrl, '_blank');
    
    return pdfBlob;
    
  } catch (error) {
    console.error('Erro ao gerar PDF do job:', error);
    throw new Error('Erro ao gerar PDF do orçamento');
  }
};

export const generateExpensesPDF = async (expenses: ExpenseData[], companyData?: CompanyData) => {
  const doc = new jsPDF();
  let currentY = 20;
  
  try {
    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Despesas', 20, currentY);
    currentY += 20;
    
    // DADOS DA EMPRESA
    if (companyData) {
      doc.setFontSize(14);
      doc.text('DADOS DA EMPRESA', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      if (companyData.name) {
        doc.text(`Nome: ${companyData.name}`, 20, currentY);
        currentY += 6;
      }
      
      if (companyData.email) {
        doc.text(`Email: ${companyData.email}`, 20, currentY);
        currentY += 6;
      }
      
      currentY += 10;
    }
    
    // RESUMO
    const totalValue = expenses.reduce((sum, expense) => sum + safeNumber(expense.value), 0);
    doc.setFontSize(14);
    doc.text('RESUMO', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.text(`Total de Despesas: ${expenses.length}`, 20, currentY);
    currentY += 6;
    doc.text(`Valor Total: R$ ${formatCurrency(totalValue)}`, 20, currentY);
    currentY += 6;
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, currentY);
    currentY += 15;
    
    // LISTA DE DESPESAS
    doc.setFontSize(14);
    doc.text('DESPESAS DETALHADAS', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(9);
    expenses.forEach((expense, index) => {
      // Verificar se precisa de nova página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${expense.description || 'Sem descrição'}`, 20, currentY);
      currentY += 6;
      
      doc.setFont(undefined, 'normal');
      doc.text(`   Valor: R$ ${formatCurrency(expense.value)}`, 20, currentY);
      currentY += 5;
      doc.text(`   Categoria: ${expense.category || 'Sem categoria'}`, 20, currentY);
      currentY += 5;
      
      if (expense.month) {
        try {
          const monthDate = new Date(expense.month + '-01');
          doc.text(`   Mês: ${monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, 20, currentY);
        } catch {
          doc.text(`   Mês: ${expense.month}`, 20, currentY);
        }
        currentY += 5;
      }
      
      if (expense.dueDate) {
        try {
          doc.text(`   Vencimento: ${new Date(expense.dueDate).toLocaleDateString('pt-BR')}`, 20, currentY);
        } catch {
          doc.text(`   Vencimento: ${expense.dueDate}`, 20, currentY);
        }
        currentY += 5;
      }
      
      if (expense.client) {
        doc.text(`   Cliente: ${expense.client}`, 20, currentY);
        currentY += 5;
      }
      
      if (expense.isRecurring) {
        doc.text(`   Despesa Recorrente`, 20, currentY);
        currentY += 5;
      }
      
      if (expense.installments && safeNumber(expense.installments) > 1) {
        doc.text(`   Parcela: ${expense.currentInstallment || 1}/${expense.installments}`, 20, currentY);
        currentY += 5;
      }
      
      currentY += 5; // Espaçamento entre despesas
    });
    
    // Gerar PDF
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Abrir em nova aba
    window.open(pdfUrl, '_blank');
    
    return pdfBlob;
    
  } catch (error) {
    console.error('Erro ao gerar PDF de despesas:', error);
    throw new Error('Erro ao gerar PDF de despesas');
  }
};

export const generateWorkItemsPDF = async (workItems: WorkItemData[], companyData?: CompanyData) => {
  const doc = new jsPDF();
  let currentY = 20;
  
  try {
    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Itens de Trabalho', 20, currentY);
    currentY += 20;
    
    // DADOS DA EMPRESA
    if (companyData) {
      doc.setFontSize(14);
      doc.text('DADOS DA EMPRESA', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      if (companyData.name) {
        doc.text(`Nome: ${companyData.name}`, 20, currentY);
        currentY += 6;
      }
      
      if (companyData.email) {
        doc.text(`Email: ${companyData.email}`, 20, currentY);
        currentY += 6;
      }
      
      currentY += 10;
    }
    
    // RESUMO
    const totalValue = workItems.reduce((sum, item) => sum + safeNumber(item.value), 0);
    const equipmentValue = workItems
      .filter(item => {
        const category = (item.category || '').toLowerCase();
        return category.includes('equipamento') || 
               category.includes('câmera') ||
               category.includes('lente') ||
               category.includes('hardware');
      })
      .reduce((sum, item) => sum + safeNumber(item.value), 0);
    
    doc.setFontSize(14);
    doc.text('RESUMO', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.text(`Total de Itens: ${workItems.length}`, 20, currentY);
    currentY += 6;
    doc.text(`Valor Total: R$ ${formatCurrency(totalValue)}`, 20, currentY);
    currentY += 6;
    doc.text(`Valor Equipamentos: R$ ${formatCurrency(equipmentValue)}`, 20, currentY);
    currentY += 6;
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, currentY);
    currentY += 15;
    
    // LISTA DE ITENS
    doc.setFontSize(14);
    doc.text('ITENS DETALHADOS', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(9);
    workItems.forEach((item, index) => {
      // Verificar se precisa de nova página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${item.description || 'Sem descrição'}`, 20, currentY);
      currentY += 6;
      
      doc.setFont(undefined, 'normal');
      doc.text(`   Valor: R$ ${formatCurrency(item.value)}`, 20, currentY);
      currentY += 5;
      doc.text(`   Categoria: ${item.category || 'Sem categoria'}`, 20, currentY);
      currentY += 5;
      doc.text(`   Depreciação: ${safeNumber(item.depreciationYears) || 5} anos`, 20, currentY);
      currentY += 5;
      
      currentY += 5; // Espaçamento entre itens
    });
    
    // Gerar PDF
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Abrir em nova aba
    window.open(pdfUrl, '_blank');
    
    return pdfBlob;
    
  } catch (error) {
    console.error('Erro ao gerar PDF de itens de trabalho:', error);
    throw new Error('Erro ao gerar PDF de itens de trabalho');
  }
};

// Funções auxiliares para manter compatibilidade
export const downloadJobPDF = (job: JobData, companyData?: CompanyData, clientData?: ClientData) => {
  generateJobPDF(job, companyData, clientData).then(() => {
    console.log('PDF gerado com sucesso');
  }).catch(error => {
    console.error('Erro ao gerar PDF:', error);
  });
};

export const downloadExpensesPDF = (expenses: ExpenseData[], companyData?: CompanyData) => {
  generateExpensesPDF(expenses, companyData).then(() => {
    console.log('PDF de despesas gerado com sucesso');
  }).catch(error => {
    console.error('Erro ao gerar PDF de despesas:', error);
  });
};

export const downloadWorkItemsPDF = (workItems: WorkItemData[], companyData?: CompanyData) => {
  generateWorkItemsPDF(workItems, companyData).then(() => {
    console.log('PDF de itens de trabalho gerado com sucesso');
  }).catch(error => {
    console.error('Erro ao gerar PDF de itens de trabalho:', error);
  });
};
