
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, UserPlus } from 'lucide-react';
import type { Agency, UserProfile } from '@/types';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCompanies();
      fetchUsers();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapeando para o formato correto conforme a tipagem
      const agenciesData: Agency[] = (data || []).map(agency => ({
        id: agency.id,
        name: agency.name,
        description: (agency as any).description || '', // Safe access with fallback
        owner_id: agency.owner_uid, // Mapeando owner_uid para owner_id
        created_at: agency.created_at,
        status: agency.status,
        cnpj: (agency as any).cnpj || undefined // Safe access with fallback
      }));
      
      setCompanies(agenciesData);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleCreateCompany = async (name: string, ownerEmail: string) => {
    try {
      // Find owner by email
      const owner = users.find(u => u.email === ownerEmail);
      if (!owner) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('agencies')
        .insert({
          name,
          owner_uid: owner.id, // Usando owner_uid conforme schema
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Convertendo para formato Agency
      const newAgency: Agency = {
        id: data.id,
        name: data.name,
        description: (data as any).description || '',
        owner_id: data.owner_uid,
        created_at: data.created_at,
        status: data.status,
        cnpj: (data as any).cnpj || undefined
      };

      setCompanies(prev => [newAgency, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanies(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Empresas</h1>
          <p className="text-gray-600">Gerencie empresas e colaboradores</p>
        </div>
        <Button className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela simples de empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManagement;
