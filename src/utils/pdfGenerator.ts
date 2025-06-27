
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

export const generateJobPDF = async (
  job: JobData, 
  companyData?: CompanyData,
  clientData?: ClientData
) => {
  const doc = new jsPDF();
  let currentY = 20;
  
  // Título
  doc.setFontSize(20);
  doc.text('Orçamento de Serviço', 20, currentY);
  currentY += 20;
  
  // DADOS DA EMPRESA
  doc.setFontSize(14);
  doc.text('DADOS DA EMPRESA', 20, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  if (companyData?.name) {
    doc.text(`Nome: ${companyData.name}`, 20, currentY);
    currentY += 6;
  }
  
  if (companyData?.email) {
    doc.text(`Email: ${companyData.email}`, 20, currentY);
    currentY += 6;
  }
  
  if (companyData?.cnpj) {
    doc.text(`CNPJ: ${companyData.cnpj}`, 20, currentY);
    currentY += 6;
  }
  
  if (companyData?.phone) {
    doc.text(`Telefone: ${companyData.phone}`, 20, currentY);
    currentY += 6;
  }
  
  if (companyData?.address) {
    doc.text(`Endereço: ${companyData.address}`, 20, currentY);
    currentY += 6;
  }
  
  currentY += 10;
  
  // DADOS DO CLIENTE
  doc.setFontSize(14);
  doc.text('DADOS DO CLIENTE', 20, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  if (clientData?.name) {
    doc.text(`Nome: ${clientData.name}`, 20, currentY);
    currentY += 6;
  }
  
  if (clientData?.phone) {
    doc.text(`Telefone: ${clientData.phone}`, 20, currentY);
    currentY += 6;
  }
  
  if (clientData?.email) {
    doc.text(`Email: ${clientData.email}`, 20, currentY);
    currentY += 6;
  }
  
  if (clientData?.cnpj) {
    doc.text(`CNPJ: ${clientData.cnpj}`, 20, currentY);
    currentY += 6;
  }
  
  if (clientData?.address) {
    doc.text(`Endereço: ${clientData.address}`, 20, currentY);
    currentY += 6;
  }
  
  currentY += 10;
  
  // DETALHES DO SERVIÇO
  doc.setFontSize(14);
  doc.text('DETALHES DO SERVIÇO', 20, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.text(`Descrição: ${job.description}`, 20, currentY);
  currentY += 6;
  
  doc.text(`Data do Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`, 20, currentY);
  currentY += 6;
  
  doc.text(`Horas Estimadas: ${job.estimatedHours}h`, 20, currentY);
  currentY += 6;
  
  doc.text(`Nível de Dificuldade: ${job.difficultyLevel}`, 20, currentY);
  currentY += 6;
  
  doc.text(`Logística: R$ ${job.logistics.toFixed(2)}`, 20, currentY);
  currentY += 6;
  
  doc.text(`Equipamentos: R$ ${job.equipment.toFixed(2)}`, 20, currentY);
  currentY += 6;
  
  doc.text(`Assistência: R$ ${job.assistance.toFixed(2)}`, 20, currentY);
  currentY += 10;
  
  // VALOR TOTAL
  doc.setFontSize(16);
  doc.text(`VALOR TOTAL: R$ ${job.totalPrice.toFixed(2)}`, 20, currentY);
  
  // Gerar PDF
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Abrir em nova aba
  window.open(pdfUrl, '_blank');
  
  return pdfBlob;
};

export const downloadJobPDF = (job: JobData, companyData?: CompanyData, clientData?: ClientData) => {
  generateJobPDF(job, companyData, clientData).then(() => {
    console.log('PDF gerado com sucesso');
  }).catch(error => {
    console.error('Erro ao gerar PDF:', error);
  });
};
