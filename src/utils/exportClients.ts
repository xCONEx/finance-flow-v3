import { Client } from '@/types/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Campos relevantes e labels amigáveis
const exportFields = [
  'name', 'phone', 'email', 'address', 'cnpj', 'description', 'tags'
];
const fieldLabels: Record<string, string> = {
  name: 'Nome',
  phone: 'Telefone',
  email: 'Email',
  address: 'Endereço',
  cnpj: 'CNPJ',
  description: 'Descrição',
  tags: 'Tags',
};

// Exporta clientes para Excel (.xlsx)
export async function exportClientsToExcel(clients: Client[]) {
  try {
    const XLSX = await import('xlsx');
    const data = clients.map(client => {
      const row: Record<string, any> = {};
      exportFields.forEach(field => {
        let value = (client as any)[field];
        if (Array.isArray(value)) value = value.join(', ');
        row[fieldLabels[field] || field] = value ?? '';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, `clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw new Error('Erro ao exportar para Excel');
  }
}

// Exporta clientes para PDF (layout limpo, campos lado a lado)
export function exportClientsToPDF(clients: Client[]) {
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(16);
  doc.text('Lista de Clientes', 14, y);
  y += 10;
  doc.setFontSize(10);

  clients.forEach((client, idx) => {
    if (idx > 0) {
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setDrawColor(200);
      doc.line(14, y, 196, y); // linha separadora
      y += 4;
    }
    const rows = exportFields.map(field => [fieldLabels[field], Array.isArray((client as any)[field]) ? (client as any)[field].join(', ') : (client as any)[field] ?? '']);
    autoTable(doc, {
      startY: y,
      head: [["Campo", "Valor"]],
      body: rows,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 140 } },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => { y = data.cursor.y; },
    });
    y = (doc as any).lastAutoTable?.finalY || y + 30;
  });
  doc.save(`clientes_${new Date().toISOString().slice(0,10)}.pdf`);
} 
