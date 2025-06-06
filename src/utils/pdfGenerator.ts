
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

export const generateJobPDF = async (job: Job, userData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;

  // Header
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.text(`Orçamento - ${job.client || 'Cliente'}`, margin, contentStartY);

  // Logo ou nome da empresa no canto direito
  if (userData?.imageuser) {
    try {
      const maxWidth = 40;
      const maxHeight = 20;
      const x = pageWidth - maxWidth - margin;
      const y = contentStartY - 5;
      doc.addImage(userData.imageuser, 'PNG', x, y, maxWidth, maxHeight);
      contentStartY += 10;
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
      // Fallback para nome da empresa
      if (userData?.personalInfo?.company || userData?.company) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        const companyName = userData?.personalInfo?.company || userData?.company;
        const companyWidth = doc.getTextWidth(companyName);
        doc.text(companyName, pageWidth - companyWidth - margin, contentStartY);
      }
      contentStartY += 10;
    }
  } else if (userData?.personalInfo?.company || userData?.company) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    const companyName = userData?.personalInfo?.company || userData?.company;
    const companyWidth = doc.getTextWidth(companyName);
    doc.text(companyName, pageWidth - companyWidth - margin, contentStartY);
    contentStartY += 10;
  }

  // Informações do job
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text(`Descrição: ${job.description || 'Não informado'}`, margin, contentStartY + 10);
  doc.text(`Data do Evento: ${new Date(job.eventDate).toLocaleDateString('pt-BR')}`, margin, contentStartY + 18);
  doc.text(`Categoria: ${job.category || 'Não informado'}`, margin, contentStartY + 26);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, contentStartY + 34);

  // Calcular valores
  const logistics = typeof job.logistics === 'number' ? job.logistics : 0;
  const equipment = typeof job.equipment === 'number' ? job.equipment : 0;
  const assistance = typeof job.assistance === 'number' ? job.assistance : 0;
  const custoTotal = logistics + equipment + assistance;
  const desconto = (job.serviceValue * (job.discountValue || 0)) / 100;
  const valorComDesconto = job.serviceValue - desconto;

  // Tabela de valores
  const tableData = [
    ['Horas estimadas', `${job.estimatedHours || 0}h`],
    ['Logística', logistics.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Equipamentos', equipment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Assistência', assistance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Custo total', custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Valor do serviço', job.serviceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
  ];

  // Adicionar desconto se existir
  if (job.discountValue && job.discountValue > 0) {
    tableData.push(['Desconto (%)', `${job.discountValue}%`]);
    tableData.push(['Valor com desconto', valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  }

  try {
    (doc as any).autoTable({
      startY: contentStartY + 45,
      head: [['Item', 'Valor']],
      body: tableData,
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
    const finalY = (doc as any).lastAutoTable?.finalY || contentStartY + 200;
    doc.text(
      'Este orçamento é uma estimativa com base nas informações fornecidas.',
      margin,
      finalY + 15
    );
  } catch (error) {
    console.error('Erro ao gerar tabela do PDF:', error);
    // Fallback: criar tabela manual se autoTable falhar
    let currentY = contentStartY + 45;
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    tableData.forEach((row, index) => {
      doc.text(row[0], margin, currentY + (index * 8));
      doc.text(row[1], margin + 100, currentY + (index * 8));
    });
  }

  doc.save(`Orcamento_${job.client?.replace(/\s+/g, '_') || 'Cliente'}_${job.description?.replace(/\s+/g, '_') || 'Job'}.pdf`);
};

export const generateWorkItemsPDF = async (workItems: WorkItem[], userData: any) => {
  const doc = new jsPDF();
  const title = 'Relatório de Itens de Trabalho';
  const date = new Date().toLocaleDateString('pt-BR');

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let contentStartY = 20;

  // Logo se disponível
  if (userData?.imageuser) {
    try {
      const maxWidth = 40;
      const maxHeight = 20;
      const x = pageWidth - maxWidth - margin;
      const y = contentStartY;

      doc.addImage(userData.imageuser, 'PNG', x, y, maxWidth, maxHeight);
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
    new Date().toLocaleDateString('pt-BR')
  ]);

  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);

  try {
    (doc as any).autoTable({
      startY: contentStartY + 30,
      head: [['Descrição', 'Categoria', 'Valor', 'Data']],
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
  } catch (error) {
    console.error('Erro ao gerar tabela:', error);
    // Fallback manual
    let currentY = contentStartY + 40;
    doc.setFontSize(10);
    tableData.forEach((row, index) => {
      row.forEach((cell, cellIndex) => {
        doc.text(cell, margin + (cellIndex * 45), currentY + (index * 8));
      });
    });
  }

  doc.save(`itens_trabalho_${date.replace(/\//g, '_')}.pdf`);
};

export const generateExpensesPDF = async (expenses: MonthlyCost[], userData: any) => {
  console.log('🔄 Iniciando geração de PDF de despesas...');
  
  try {
    const doc = new jsPDF();
    const title = 'Relatório de Despesas Mensais';
    const date = new Date().toLocaleDateString('pt-BR');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let contentStartY = 20;

    // Logo se disponível
    if (userData?.imageuser) {
      try {
        const maxWidth = 40;
        const maxHeight = 20;
        const x = pageWidth - maxWidth - margin;
        const y = contentStartY;

        doc.addImage(userData.imageuser, 'PNG', x, y, maxWidth, maxHeight);
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

    // Preparar dados da tabela
    const tableData = expenses.map(expense => [
      expense.description || 'Sem descrição',
      expense.category || 'Sem categoria',
      expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      new Date(expense.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    ]);

    const totalValue = expenses.reduce((sum, expense) => sum + (expense.value || 0), 0);

    // Adicionar linha de total
    tableData.push([
      'TOTAL',
      '',
      totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ''
    ]);

    // Tentar usar autoTable, com fallback manual
    try {
      console.log('📊 Tentando gerar tabela com autoTable...');
      (doc as any).autoTable({
        startY: contentStartY + 30,
        head: [['Descrição', 'Categoria', 'Valor', 'Mês']],
        body: tableData,
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
      console.log('✅ Tabela criada com autoTable');
    } catch (autoTableError) {
      console.error('❌ Erro com autoTable, usando fallback manual:', autoTableError);
      
      // Fallback: criar tabela manual
      let currentY = contentStartY + 40;
      doc.setFontSize(11);
      doc.setTextColor(0);
      
      // Cabeçalho
      doc.setFont(undefined, 'bold');
      doc.text('Descrição', margin, currentY);
      doc.text('Categoria', margin + 60, currentY);
      doc.text('Valor', margin + 120, currentY);
      doc.text('Mês', margin + 170, currentY);
      
      currentY += 10;
      doc.setFont(undefined, 'normal');
      
      // Dados
      tableData.forEach((row, index) => {
        doc.text(row[0].substring(0, 25), margin, currentY + (index * 8));
        doc.text(row[1].substring(0, 15), margin + 60, currentY + (index * 8));
        doc.text(row[2], margin + 120, currentY + (index * 8));
        doc.text(row[3].substring(0, 15), margin + 170, currentY + (index * 8));
      });
    }

    console.log('💾 Salvando PDF...');
    doc.save(`despesas_mensais_${date.replace(/\//g, '_')}.pdf`);
    console.log('✅ PDF de despesas gerado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral ao gerar PDF de despesas:', error);
    throw new Error('Falha ao gerar PDF de despesas: ' + error.message);
  }
};
