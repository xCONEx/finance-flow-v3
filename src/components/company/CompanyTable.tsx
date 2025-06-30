import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface Company {
  id: string;
  name: string;
  owner_id: string; // CORRIGIDO: usar owner_id conforme schema SQL
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
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{company.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{company.owner_email}</p>
                    {company.owner_name && company.owner_name !== 'N/A' && (
                      <p className="text-xs text-muted-foreground truncate">{company.owner_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">ID: {company.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {company.collaborators_count}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {new Date(company.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onViewCollaborators(company)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver colaboradores
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onInviteCollaborator(company)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Convidar colaborador
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEditCompany(company)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar empresa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteCompany(company.id)}
                        className="flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir empresa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompanyTable;
