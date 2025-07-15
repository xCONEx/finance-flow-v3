import { Client } from '@/types/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Exporta clientes para Excel (.xlsx)
export function exportClientsToExcel(clients: Client[]) {
  // Extrai todos os campos possíveis do modelo Client
  const allFields = [
    'id', 'user_id', 'user_email', 'company_id', 'name', 'phone', 'email', 'address', 'cnpj', 'description', 'created_at', 'updated_at', 'tags'
  ];
  // Garante que todos os campos estejam presentes em cada linha
  const data = clients.map(client => {
    const row: Record<string, any> = {};
    allFields.forEach(field => {
      let value = (client as any)[field];
      if (Array.isArray(value)) value = value.join(', ');
      row[field] = value ?? '';
    });
    return row;
  });
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
  XLSX.writeFile(workbook, `clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// Exporta clientes para PDF
export function exportClientsToPDF(clients: Client[]) {
  const doc = new jsPDF();
  const allFields = [
    'id', 'user_id', 'user_email', 'company_id', 'name', 'phone', 'email', 'address', 'cnpj', 'description', 'created_at', 'updated_at', 'tags'
  ];
  const fieldLabels: Record<string, string> = {
    id: 'ID',
    user_id: 'Usuário',
    user_email: 'Email do Usuário',
    company_id: 'Empresa',
    name: 'Nome',
    phone: 'Telefone',
    email: 'Email',
    address: 'Endereço',
    cnpj: 'CNPJ',
    description: 'Descrição',
    created_at: 'Criado em',
    updated_at: 'Atualizado em',
    tags: 'Tags',
  };
  const tableData = clients.map(client =>
    allFields.map(field => {
      let value = (client as any)[field];
      if (Array.isArray(value)) value = value.join(', ');
      return value ?? '';
    })
  );
  autoTable(doc, {
    head: [allFields.map(f => fieldLabels[f] || f)],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    margin: { top: 20 },
  });
  doc.save(`clientes_${new Date().toISOString().slice(0,10)}.pdf`);
} 
