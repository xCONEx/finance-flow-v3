
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Plus, Edit, Trash2, FileText, Calendar, DollarSign, Upload, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/client';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import { formatCurrency } from '@/utils/formatters';

interface Contract {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  description: string;
  value: number;
  start_date: string;
  end_date: string;
  status: 'ativo' | 'finalizado' | 'cancelado';
  contract_file_url?: string;
  contract_file_name?: string;
  created_at: string;
  updated_at: string;
}

interface ClientContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const ClientContractsModal: React.FC<ClientContractsModalProps> = ({ isOpen, onClose, client }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: 0,
    start_date: '',
    end_date: '',
    status: 'ativo' as const
  });
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const loadContracts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', client.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar contratos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar contratos.",
          variant: "destructive",
        });
        return;
      }

      setContracts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contratos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContracts();
    }
  }, [isOpen, client.id, user]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      value: 0,
      start_date: '',
      end_date: '',
      status: 'ativo'
    });
    setEditingContract(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      const contractData = {
        client_id: client.id,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        value: formData.value,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status
      };

      if (editingContract) {
        const { error } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', editingContract.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Contrato atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert([contractData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Contrato adicionado com sucesso!",
        });
      }

      resetForm();
      loadContracts();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar contrato.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contract: Contract) => {
    setFormData({
      title: contract.title,
      description: contract.description,
      value: contract.value,
      start_date: contract.start_date,
      end_date: contract.end_date,
      status: contract.status
    });
    setEditingContract(contract);
    setShowAddForm(true);
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    if (!user) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contrato excluído com sucesso!",
      });

      loadContracts();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contrato.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (contractId: string, file: File) => {
    if (!user) return;

    try {
      setUploading(true);

      // Upload do arquivo para o storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${contractId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Atualizar o registro do contrato com a URL do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          contract_file_url: publicUrl,
          contract_file_name: file.name
        })
        .eq('id', contractId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Arquivo de contrato enviado com sucesso!",
      });

      loadContracts();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPDF = async (contract: Contract) => {
    try {
      await generateContractPDF(contract, client, user);
      toast({
        title: "Sucesso",
        description: "PDF do contrato baixado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do contrato.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { label: 'Ativo', variant: 'default' as const },
      finalizado: { label: 'Finalizado', variant: 'secondary' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contratos - {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com botão adicionar */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              Contratos ({contracts.length})
            </h3>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato
            </Button>
          </div>

          {/* Formulário de adicionar/editar */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        placeholder="Nome do contrato"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="value">Valor (R$)</Label>
                      <CurrencyInput
                        id="value"
                        value={formData.value}
                        onChange={(value) => setFormData({ ...formData, value })}
                        placeholder="0,00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_date">Data de Início</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">Data de Término</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descrição do contrato"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingContract ? 'Salvar Alterações' : 'Adicionar Contrato'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de contratos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Carregando contratos...</div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum contrato cadastrado ainda.</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{contract.title}</h4>
                        {contract.description && (
                          <p className="text-gray-600 text-sm mt-1">{contract.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contract.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(contract)}
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(contract.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={uploading}
                            title="Upload do contrato"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contract)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{formatCurrency(contract.value)}</span>
                      </div>
                      {contract.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>Início: {new Date(contract.start_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {contract.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <span>Fim: {new Date(contract.end_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {contract.contract_file_name && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <a
                            href={contract.contract_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {contract.contract_file_name}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
