
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Edit,
  Trash2,
  UserPlus,
  Eye
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  owner_id: string; // CORRIGIDO: usar owner_id
  owner_email: string;
  owner_name?: string;
  status: string;
  created_at: string;
  collaborators_count: number;
}

interface CompanyTableProps {
  companies: Company[];
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
  onViewCollaborators: (company: Company) => void;
  onInviteCollaborator: (company: Company) => void;
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  onEditCompany,
  onDeleteCompany,
  onViewCollaborators,
  onInviteCollaborator
}) => {
  if (companies.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Nenhuma empresa encontrada</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Empresa</TableHead>
            <TableHead className="min-w-[180px] hidden md:table-cell">Proprietário</TableHead>
            <TableHead className="min-w-[80px]">
              <Users className="h-4 w-4 inline md:mr-1" />
              <span className="hidden md:inline">Colaboradores</span>
            </TableHead>
            <TableHead className="min-w-[100px] hidden lg:table-cell">Criada</TableHead>
            <TableHead className="min-w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{company.name}</p>
                  <p className="text-xs text-gray-400 md:hidden">{company.owner_email}</p>
                  <p className="text-xs text-gray-400">ID: {company.id.slice(0, 8)}...</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div>
                  <p className="text-sm">{company.owner_email}</p>
                  {company.owner_name && company.owner_name !== 'N/A' && (
                    <p className="text-xs text-gray-600">{company.owner_name}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {company.collaborators_count}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <p className="text-sm">
                  {new Date(company.created_at).toLocaleDateString('pt-BR')}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewCollaborators(company)}
                    className="p-2"
                    title="Ver colaboradores"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInviteCollaborator(company)}
                    className="p-2"
                    title="Convidar colaborador"
                  >
                    <UserPlus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditCompany(company)}
                    className="p-2"
                    title="Editar empresa"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteCompany(company.id)}
                    className="p-2"
                    title="Excluir empresa"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyTable;
