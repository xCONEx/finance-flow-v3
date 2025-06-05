
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Job, WorkItem, MonthlyCost } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const title = `Orçamento: ${job.description}`;
  const date = new Date().toLocaleDateString('pt-BR');

  const gerarPDF = (logoBase64: string | null = null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let contentStartY = 20;

    // Se tiver logo, renderiza na mesma linha do título, à direita
    if (logoBase64) {
      try {
        const maxWidth = 40;
        const maxHeight = 20;
        const x = pageWidth - maxWidth - margin;
        const y = contentStartY;

        doc.addImage(logoBase64, 'PNG', x, y, maxWidth, maxHeight);
        contentStartY = y + maxHeight + 10;
      } catch (error) {
        console.error('Erro ao adicionar logo:', error);
        contentStartY = 20;
      }
    }

    renderTexto(contentStartY);

    function renderTexto(startY: number) {
      // Título
      doc.setFontSize(18);
      doc.setTextColor(33, 37, 41);
      doc.text(title, margin, startY);

      const infoStartY = startY + 10;

      // Info
      doc.setFontSize(12);
      doc.setTextColor(55, 65, 81);
      doc.text(`Cliente: ${job.client || 'Não informado'}`, margin, infoStartY + 0);
      doc.text(`Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR') || 'Não definida'}`, margin, infoStartY + 8);
      doc.text(`Gerado em: ${date}`, margin, infoStartY + 16);
      doc.text(`Categoria: ${job.category || 'Outro'}`, margin, infoStartY + 24);

      // Calcular valores
      const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
      const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
      const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
      const custoTotal = logistics + equipment + assistance;
      const desconto = (job.serviceValue * job.discountValue) / 100;
      const valorFinal = job.serviceValue - desconto;

      // Tabela
      doc.autoTable({
        startY: infoStartY + 35,
        head: [['Item', 'Valor (R$)']],
        body: [
          ['Horas estimadas', `${job.estimatedHours || 0}h`],
          ['Logística', logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
          ['Equipamentos', equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
          ['Assistência', assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
          ['Custo total', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
          ['Valor do serviço', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
          ['Desconto (%)', `${job.discountValue}%`],
          ['Valor total', valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontSize: 12,
        },
        bodyStyles: {
          fontSize: 11,
        },
      });

      // Rodapé
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        'Este orçamento é uma estimativa com base nas informações fornecidas.',
        margin,
        doc.lastAutoTable.finalY + 12
      );

      doc.save(`${job.description.replace(/\s+/g, '_')}_orcamento.pdf`);
    }
  };

  const logoBase64 = userData?.logobase64 || null;
  gerarPDF(logoBase64);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const title = 'Relatório de Itens de Trabalho';
  const date = new Date().toLocaleDateString('pt-BR');

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;

  // Logo se disponível
  if (userData?.logobase64) {
    try {
      const maxWidth = 40;
      const maxHeight = 20;
      const x = pageWidth - maxWidth - margin;
      const y = contentStartY;

      doc.addImage(userData.logobase64, 'PNG', x, y, maxWidth, maxHeight);
      contentStartY = y + maxHeight + 10;
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }

  // Título
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text(title, margin, contentStartY);

  // Info
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text(`Gerado em: ${date}`, margin, contentStartY + 10);
  doc.text(`Total de itens: ${workItems.length}`, margin, contentStartY + 18);

  // Tabela
  const tableData = workItems.map(item => [
    item.description,
    item.category,
    item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    `${item.depreciationYears} anos`
  ]);

  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);

  doc.autoTable({
    startY: contentStartY + 30,
    head: [['Descrição', 'Categoria', 'Valor', 'Depreciação']],
    body: [
      ...tableData,
      ['TOTAL', '', totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '']
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
  });

  doc.save(`itens_trabalho_${date.replace(/\//g, '_')}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  const doc = new jsPDF();
  const title = 'Relatório de Despesas Mensais';
  const date = new Date().toLocaleDateString('pt-BR');

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;

  // Logo se disponível
  if (userData?.logobase64) {
    try {
      const maxWidth = 40;
      const maxHeight = 20;
      const x = pageWidth - maxWidth - margin;
      const y = contentStartY;

      doc.addImage(userData.logobase64, 'PNG', x, y, maxWidth, maxHeight);
      contentStartY = y + maxHeight + 10;
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }

  // Título
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text(title, margin, contentStartY);

  // Info
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text(`Gerado em: ${date}`, margin, contentStartY + 10);
  doc.text(`Total de despesas: ${expenses.length}`, margin, contentStartY + 18);

  // Tabela
  const tableData = expenses.map(expense => [
    expense.description,
    expense.category,
    expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    new Date(expense.month).toLocaleDateString('pt-BR')
  ]);

  const totalValue = expenses.reduce((sum, expense) => sum + expense.value, 0);

  doc.autoTable({
    startY: contentStartY + 30,
    head: [['Descrição', 'Categoria', 'Valor', 'Mês']],
    body: [
      ...tableData,
      ['TOTAL', '', totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '']
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
  });

  doc.save(`despesas_mensais_${date.replace(/\//g, '_')}.pdf`);
};
