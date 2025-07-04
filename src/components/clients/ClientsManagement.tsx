import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/client';
import { AddClientModal } from './AddClientModal';
import { EditClientModal } from './EditClientModal';
import { ClientDetailsModal } from './ClientDetailsModal';
import { ClientContractsModal } from './ClientContractsModal';

const ClientsManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContractsModal, setShowContractsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { user, profile, agency } = useSupabaseAuth();
  const { toast } = useToast();

  const loadClients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar user_email para clientes existentes que não possuem
      const clientsToUpdate = (data || []).filter(client => !client.user_email);
      if (clientsToUpdate.length > 0 && user.email) {
        const updatePromises = clientsToUpdate.map(client =>
          supabase
            .from('clients')
            .update({ user_email: user.email })
            .eq('id', client.id)
        );
        
        await Promise.all(updatePromises);
        
        // Recarregar dados após atualização
        const { data: updatedData } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setClients(updatedData || []);
      } else {
        setClients(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [user, agency]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  const handleDelete = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setClients(clients.filter(c => c.id !== clientId));
      
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

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleViewContracts = (client: Client) => {
    setSelectedClient(client);
    setShowContractsModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Gerencie seus clientes e acompanhe o histórico de trabalhos
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-fit flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar Cliente</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </div>

      {/* Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg sm:text-xl">
              Lista de Clientes ({filteredClients.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm
                  ? 'Nenhum cliente encontrado com os critérios de busca.'
                  : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.cnpj && (
                            <Badge variant="outline">{client.cnpj}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContracts(client)}
                              title="Contratos"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(client)}
                              title="Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(client)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{client.name}</h3>
                        </div>
                        {client.cnpj && (
                          <Badge variant="outline" className="text-xs">
                            {client.cnpj}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-500" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-500" />
                            {client.email}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-1 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewContracts(client)}
                          className="flex flex-col items-center gap-1 p-2 h-auto"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">Contratos</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(client)}
                          className="flex flex-col items-center gap-1 p-2 h-auto"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">Detalhes</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          className="flex flex-col items-center gap-1 p-2 h-auto"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-xs">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="flex flex-col items-center gap-1 p-2 h-auto text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadClients();
          setShowAddModal(false);
        }}
      />

      {selectedClient && (
        <>
          <EditClientModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedClient(null);
            }}
            onSuccess={() => {
              loadClients();
              setShowEditModal(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />

          <ClientDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />

          <ClientContractsModal
            isOpen={showContractsModal}
            onClose={() => {
              setShowContractsModal(false);
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
