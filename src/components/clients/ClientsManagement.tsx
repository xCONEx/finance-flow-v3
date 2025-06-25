
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash, Eye, FileText, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import AddClientModal from './AddClientModal';
import EditClientModal from './EditClientModal';
import ClientDetailsModal from './ClientDetailsModal';
import ClientContractsModal from './ClientContractsModal';
import ClientJobHistory from './ClientJobHistory';
import type { Client } from '@/types';

const ClientsManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const [isJobHistoryModalOpen, setIsJobHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const handleOpenContracts = (client: Client) => {
    setSelectedClient(client);
    setIsContractsModalOpen(true);
  };

  const handleOpenJobHistory = (client: Client) => {
    setSelectedClient(client);
    setIsJobHistoryModalOpen(true);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e relacionamentos</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <Badge variant="secondary">Cliente</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {client.email}
                </p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-600">
                  <strong>Telefone:</strong> {client.phone}
                </p>
              )}
              {client.cnpj && (
                <p className="text-sm text-gray-600">
                  <strong>CNPJ:</strong> {client.cnpj}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDetails(client)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(client)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenContracts(client)}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Contratos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenJobHistory(client)}
                  className="flex items-center gap-1"
                >
                  <History className="h-3 w-3" />
                  Histórico
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClient(client.id)}
                  className="flex items-center gap-1"
                >
                  <Trash className="h-3 w-3" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum cliente encontrado com esse termo.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        </div>
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={fetchClients}
      />

      {selectedClient && (
        <>
          <EditClientModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
            onClientUpdated={fetchClients}
          />

          <ClientDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />

          <ClientContractsModal
            isOpen={isContractsModalOpen}
            onClose={() => {
              setIsContractsModalOpen(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />

          <ClientJobHistory
            isOpen={isJobHistoryModalOpen}
            onClose={() => {
              setIsJobHistoryModalOpen(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />
        </>
      )}
    </div>
  );
};

export default ClientsManagement;
