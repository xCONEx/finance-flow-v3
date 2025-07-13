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
  workItems?: WorkItemData[];
}

interface CompanyData {
  name?: string;
  email?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  subscription?: string;
  userType?: string;
  agencyId?: string;
  logoUrl?: string;
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

// Função para determinar se deve mostrar dados da empresa
const shouldShowCompanyData = (companyData?: CompanyData): boolean => {
  if (!companyData) return false;
  
  const subscription = companyData.subscription;
  const userType = companyData.userType;
  const hasAgency = companyData.agencyId;
  
  // Se for premium ou enterprise e tiver company ou agencies, mostrar
  if ((subscription === 'premium' || subscription === 'enterprise' || subscription === 'enterprise-annual') && 
      (companyData.name || hasAgency)) {
    return true;
  }
  
  return false;
};

// Função para obter o nome da empresa a ser exibido
const getCompanyDisplayName = (companyData?: CompanyData): string => {
  if (!companyData) return '';
  
  // Se for free, usar apenas o nome
  if (companyData.subscription === 'free') {
    return companyData.name || '';
  }
  
  // Se for premium ou enterprise e tiver company ou agencies, mostrar
  if (shouldShowCompanyData(companyData)) {
    return companyData.name || '';
  }
  
  return '';
};

// Função para verificar se o usuário pode usar logo (premium/enterprise)
const canUseLogo = (companyData?: CompanyData): boolean => {
  if (!companyData) return false;
  
  const subscription = companyData.subscription;
  return subscription === 'premium' || subscription === 'enterprise' || subscription === 'enterprise-annual';
};

// Função para carregar e adicionar logo
const addLogo = async (pdf: jsPDF, companyData?: CompanyData): Promise<number> => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = 30;
  const maxHeight = 15;
  const logoY = 5;

  const insertLogo = async (base64: string) => {
    try {
      const { width, height } = pdf.getImageProperties(base64);

      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio, 1); // mantém proporção, sem ultrapassar o máximo

      const finalWidth = width * ratio;
      const finalHeight = height * ratio;

      const logoX = pageWidth - margin - finalWidth;

      pdf.addImage(base64, 'JPEG', logoX, logoY, finalWidth, finalHeight);
      return logoX; // Retorna a posição X da logo para ajustar o texto
    } catch (err) {
      console.error('Erro ao inserir imagem:', err);
      return pageWidth - margin; // Fallback se der erro
    }
  };

  if (canUseLogo(companyData) && companyData?.logoUrl) {
    try {
      if (companyData.logoUrl.startsWith('data:')) {
        return await insertLogo(companyData.logoUrl);
      }

      const response = await fetch(companyData.logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      return new Promise<number>((resolve) => {
        reader.onload = async () => {
          const base64 = reader.result as string;
          const logoX = await insertLogo(base64);
          resolve(logoX);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    }
  }

  return pageWidth - margin; // Retorna posição padrão se não houver logo
};

// Função para adicionar header com logo
const addHeader = async (pdf: jsPDF, companyData?: CompanyData): Promise<number> => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  
  // Cores
  const primaryColor = [41, 128, 185]; // Azul
  
  // Background azul do header
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, 30, 'F');

  // Adicionar logo se disponível
  const logoTextX = await addLogo(pdf, companyData);

  // Título em branco
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text('ORÇAMENTO DE SERVIÇO', margin, 20);
  
  return 45; // Retorna a posição Y para continuar o conteúdo
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
    // Header com logo
    yPosition = await addHeader(doc, companyData);
    
    doc.setTextColor(0, 0, 0);
    
    // DADOS DA EMPRESA
    if (shouldShowCompanyData(companyData)) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(12);
      doc.text('DADOS DA EMPRESA', 20, yPosition + 6);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const companyFields = [
        { label: 'Empresa:', value: getCompanyDisplayName(companyData) || 'Não informado' },
        { label: 'E-mail:', value: companyData?.email || 'Não informado' },
        { label: 'Telefone:', value: companyData?.phone || 'Não informado' },
        { label: 'Endereço:', value: companyData?.address || 'Não informado' }
      ];
      
      // Adicionar CNPJ apenas se tiver empresa cadastrada e CNPJ
      if (companyData?.cnpj && companyData?.name) {
        companyFields.splice(2, 0, { label: 'CNPJ:', value: companyData.cnpj });
      }
      
      companyFields.forEach(field => {
        doc.text(field.label, 20, yPosition);
        doc.text(field.value, 70, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }
    
    // DADOS DO CLIENTE
    // Verificar se há dados do cliente para exibir
    const hasClientData = clientData?.name || clientData?.email || clientData?.cnpj || clientData?.phone || clientData?.address || job.client;
    
    if (hasClientData) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(12);
      doc.text('DADOS DO CLIENTE', 20, yPosition + 6);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Se tiver cliente cadastrado, usar os dados do cliente
      // Se não tiver, usar apenas os dados colocados no job
      const clientName = clientData?.name || job.client;
      const clientEmail = clientData?.email;
      const clientCnpj = clientData?.cnpj;
      const clientPhone = clientData?.phone;
      const clientAddress = clientData?.address;
      
      // Criar array apenas com campos que têm dados
      const clientFields = [];
      
      if (clientName) {
        clientFields.push({ label: 'Nome do Cliente:', value: clientName });
      }
      
      if (clientEmail) {
        clientFields.push({ label: 'E-mail do Cliente:', value: clientEmail });
      }
      
      if (clientCnpj) {
        clientFields.push({ label: 'CNPJ do Cliente:', value: clientCnpj });
      }
      
      if (clientPhone) {
        clientFields.push({ label: 'Telefone do Cliente:', value: clientPhone });
      }
      
      if (clientAddress) {
        clientFields.push({ label: 'Endereço do Cliente:', value: clientAddress });
      }
      
      // Só exibir a seção se houver pelo menos um campo com dados
      if (clientFields.length > 0) {
        clientFields.forEach(field => {
          doc.text(field.label, 20, yPosition);
          doc.text(field.value, 70, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      } else {
        // Se não há campos com dados, remover o título da seção
        yPosition -= 15;
      }
    }
    
    // DETALHES DO SERVIÇO
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(12);
    doc.text('DETALHES DO SERVIÇO', 20, yPosition + 6);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const serviceFields = [
      { label: 'Descrição:', value: job.description || 'Não informado' },
      { label: 'Data do Evento:', value: job.eventDate ? new Date(job.eventDate).toLocaleDateString('pt-BR') : 'Não informado' },
      { label: 'Horas Estimadas:', value: `${safeNumber(job.estimatedHours)}h` }
    ];
    
    serviceFields.forEach(field => {
      doc.text(field.label, 20, yPosition);
      doc.text(field.value, 70, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    
    // ITENS DO ORÇAMENTO - Tabela de valores
    const hasAnyValues = safeNumber(job.logistics) > 0 || 
                        safeNumber(job.equipment) > 0 || 
                        safeNumber(job.assistance) > 0 || 
                        safeNumber(job.totalPrice) > 0;
    
    if (hasAnyValues) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(12);
      doc.text('ITENS DO ORÇAMENTO', 20, yPosition + 6);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Calcular valores
      const logisticsValue = safeNumber(job.logistics);
      const equipmentValue = safeNumber(job.equipment);
      const assistanceValue = safeNumber(job.assistance);
      const serviceValue = safeNumber(job.totalPrice) - logisticsValue - equipmentValue - assistanceValue;
      const discountValue = safeNumber(job.totalPrice) - serviceValue;
      
      // Criar tabela de valores
      const budgetItems = [];
      
      if (logisticsValue > 0) {
        budgetItems.push({ label: 'Logística', value: logisticsValue });
      }
      
      if (equipmentValue > 0) {
        budgetItems.push({ label: 'Equipamentos', value: equipmentValue });
      }
      
      if (assistanceValue > 0) {
        budgetItems.push({ label: 'Assistência', value: assistanceValue });
      }
      
      if (serviceValue > 0) {
        budgetItems.push({ label: 'Valor do Serviço', value: serviceValue });
      }
      
      if (discountValue > 0) {
        budgetItems.push({ label: 'Valor com Desconto', value: discountValue });
      }
      
      // Desenhar tabela com quebra de página se necessário
      const tableStartY = yPosition;
      const tableWidth = 180;
      const rowHeight = 8;
      const maxY = 270; // Limite inferior da página
      let currentY = tableStartY;
      
      // Cabeçalho da tabela
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, currentY, tableWidth, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Item', 20, currentY + 6);
      doc.text('Valor', 140, currentY + 6);
      currentY += rowHeight;
      
      // Linhas da tabela
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      budgetItems.forEach((item, index) => {
        // Se passar do limite da página, cria nova página e redesenha cabeçalho
        if (currentY + rowHeight > maxY) {
          doc.addPage();
          currentY = 20;
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(15, currentY, tableWidth, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('Item', 20, currentY + 6);
          doc.text('Valor', 140, currentY + 6);
          currentY += rowHeight;
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
        }
        // Linha de fundo alternada
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(15, currentY, tableWidth, rowHeight, 'F');
        }
        // Borda da linha
        doc.setDrawColor(200, 200, 200);
        doc.line(15, currentY, 195, currentY);
        // Conteúdo
        doc.text(item.label, 20, currentY + 6);
        doc.text(`R$ ${formatCurrency(item.value)}`, 140, currentY + 6);
        currentY += rowHeight;
      });
      // Linha final da tabela
      doc.line(15, currentY, 195, currentY);
      yPosition = currentY + 10;
    }
    
    // VALOR TOTAL - Destacado
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
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
    
    // Abrir em nova aba para impressão
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
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
    
    // Abrir em nova aba para impressão
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
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
    
    // Abrir em nova aba para impressão
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    return pdfBlob;
    
  } catch (error) {
    console.error('Erro ao gerar PDF de itens de trabalho:', error);
    throw new Error('Erro ao gerar PDF de itens de trabalho');
  }
};

// Função auxiliar para preparar dados da empresa
export const prepareCompanyData = (profile: any, user: any) => {
  return {
    name: profile?.company || profile?.name,
    email: profile?.email || user?.email,
    cnpj: profile?.cnpj,
    phone: profile?.phone,
    address: profile?.address,
    subscription: profile?.subscription,
    userType: profile?.user_type,
    agencyId: profile?.agency_id,
    logoUrl: profile?.logo_base64 // Incluir logo do perfil
  };
};

// Função auxiliar para converter Job para JobData
export const prepareJobData = (job: any, workItems: any[] = []) => {
  return {
    id: job.id,
    description: job.description,
    client: job.client,
    eventDate: job.eventDate,
    estimatedHours: job.estimatedHours,
    difficultyLevel: job.difficultyLevel,
    logistics: job.logistics,
    equipment: job.equipment,
    assistance: job.assistance,
    totalPrice: job.valueWithDiscount || job.serviceValue || 0,
    workItems: workItems.map(item => ({
      id: item.id,
      description: item.description,
      category: item.category,
      value: item.value,
      depreciationYears: item.depreciationYears
    }))
  };
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

// Função de exemplo para demonstrar o uso completo
export const generateExamplePDF = async (profile: any, user: any) => {
  // Dados de exemplo
  const exampleJob = {
    id: 'example-1',
    description: 'Filmagem de evento corporativo',
    client: 'Empresa ABC Ltda',
    eventDate: '2024-02-15',
    estimatedHours: 8,
    difficultyLevel: 'médio',
    logistics: 500,
    equipment: 1200,
    assistance: 800,
    valueWithDiscount: 3500,
    serviceValue: 3000
  };

  const exampleWorkItems = [
    {
      id: 'item-1',
      description: 'Câmera Canon EOS R5',
      category: 'Câmeras',
      value: 15000,
      depreciationYears: 5
    },
    {
      id: 'item-2',
      description: 'Lente 24-70mm f/2.8',
      category: 'Lentes',
      value: 8000,
      depreciationYears: 5
    },
    {
      id: 'item-3',
      description: 'Tripé Manfrotto',
      category: 'Tripés e Suportes',
      value: 1200,
      depreciationYears: 3
    }
  ];

  const exampleClient = {
    name: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com.br',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo/SP'
  };

  // Preparar dados
  const companyData = prepareCompanyData(profile, user);
  const jobData = prepareJobData(exampleJob, exampleWorkItems);

  // Gerar PDF
  await generateJobPDF(jobData, companyData, exampleClient);
};
