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
import { exportClientsToExcel, exportClientsToPDF } from '@/utils/exportClients';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMediaQuery } from 'react-responsive';

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
  const [importedClients, setImportedClients] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'preview' | 'conflict' | 'done'>('preview');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [importAction, setImportAction] = useState<'overwrite' | 'ignore' | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });

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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      setImportedClients(json as any[]);
      setShowImportModal(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const requiredFields = ['name', 'email'];

  const validateImportedClients = (imported: any[]) => {
    return imported.map((row, idx) => {
      const missing = requiredFields.filter(f => !row[f] || String(row[f]).trim() === '');
      return { ...row, _row: idx + 1, _missing: missing };
    });
  };

  const checkConflicts = (imported: any[]) => {
    const emails = imported.map(c => c.email?.toLowerCase()).filter(Boolean);
    const existingEmails = clients.map(c => c.email?.toLowerCase()).filter(Boolean);
    return imported.filter(c => c.email && existingEmails.includes(c.email.toLowerCase()));
  };

  const handlePreviewConfirm = () => {
    const conflictsFound = checkConflicts(importedClients);
    if (conflictsFound.length > 0) {
      setConflicts(conflictsFound);
      setImportStep('conflict');
    } else {
      handleImport('ignore');
    }
  };

  const handleImport = async (action: 'overwrite' | 'ignore') => {
    setImportAction(action);
    // Filtra clientes válidos
    const validated = validateImportedClients(importedClients);
    let toImport = validated.filter(c => c._missing.length === 0);
    if (action === 'ignore') {
      // Remove duplicados
      const existingEmails = clients.map(c => c.email?.toLowerCase());
      toImport = toImport.filter(c => !existingEmails.includes(c.email.toLowerCase()));
    }
    // Se overwrite, mantém todos e sobrescreve duplicados
    for (const client of toImport) {
      // Se já existe, update; senão, insert
      const existing = clients.find(c => c.email?.toLowerCase() === client.email.toLowerCase());
      if (existing && action === 'overwrite') {
        await supabase.from('clients').update({ ...client }).eq('id', existing.id);
      } else if (!existing) {
        await supabase.from('clients').insert([{ ...client, user_id: user.id, user_email: user.email }]);
      }
    }
    setImportStep('done');
    loadClients();
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportStep('preview');
    setImportedClients([]);
    setConflicts([]);
    setImportAction(null);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportClientsToExcel(filteredClients)}
                >
                  Exportar Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportClientsToPDF(filteredClients)}
                >
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Importar Excel
                </Button>
                <input
                  type="file"
                  accept=".xlsx"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImportExcel}
                />
              </div>
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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {client.name}
                            {client.tags && client.tags.length > 0 && client.tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs ml-1">{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                            ))}
                          </div>
                        </TableCell>
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
                  <Card key={client.id} className="p-4 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg flex items-center gap-2">{client.name}
                          {client.tags && client.tags.length > 0 && client.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs ml-1">{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                          ))}
                        </h3>
                        {client.cnpj && (
                          <Badge variant="outline" className="text-xs mt-1 mb-2 block w-fit">{client.cnpj}</Badge>
                        )}
                      </div>
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

      {/* Modal de Importação */}
      <Dialog open={showImportModal} onOpenChange={closeImportModal}>
        <DialogContent className={isMobile ? 'w-full max-w-full p-2' : 'max-w-2xl'}>
          <DialogHeader>
            <DialogTitle>Pré-visualização da Importação</DialogTitle>
          </DialogHeader>
          {importStep === 'preview' && (
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    {Object.keys(importedClients[0] || {}).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                    <TableHead>Campos obrigatórios ausentes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validateImportedClients(importedClients).map((row, idx) => (
                    <TableRow key={idx} className={row._missing.length > 0 ? 'bg-red-50' : ''}>
                      <TableCell>{row._row}</TableCell>
                      {Object.keys(importedClients[0] || {}).map((key) => (
                        <TableCell key={key}>{row[key]}</TableCell>
                      ))}
                      <TableCell>
                        {row._missing.length > 0 ? row._missing.join(', ') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-xs text-gray-500 mt-2">Linhas em vermelho possuem campos obrigatórios ausentes e não serão importadas.</div>
            </div>
          )}
          {importStep === 'conflict' && (
            <div className="space-y-4">
              <div className="text-sm text-yellow-700 bg-yellow-100 rounded p-2">
                Existem clientes no arquivo com e-mail já cadastrado.<br />
                O que deseja fazer?
              </div>
              <ul className="text-xs text-gray-700 mb-2">
                {conflicts.map((c, i) => (
                  <li key={i}>Linha: {i + 1} - Email: {c.email}</li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handleImport('overwrite')} variant="destructive">Sobrescrever existentes</Button>
                <Button onClick={() => handleImport('ignore')} variant="outline">Ignorar duplicados</Button>
                <Button onClick={closeImportModal} variant="ghost">Cancelar</Button>
              </div>
            </div>
          )}
          {importStep === 'done' && (
            <div className="text-green-700 bg-green-100 rounded p-4 text-center">
              Importação concluída com sucesso!
              <div className="mt-4">
                <Button onClick={closeImportModal}>Fechar</Button>
              </div>
            </div>
          )}
          {importStep === 'preview' && (
            <DialogFooter className="mt-4">
              <Button onClick={handlePreviewConfirm} disabled={importedClients.length === 0}>Confirmar Importação</Button>
              <Button onClick={closeImportModal} variant="ghost">Cancelar</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsManagement;
