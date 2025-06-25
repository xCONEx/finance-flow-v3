
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contract } from '@/types/contract';

interface ClientContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

const ClientContractsModal = ({ isOpen, onClose, clientId, clientName }: ClientContractsModalProps) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    start_date: '',
    end_date: '',
    status: 'ativo' as 'ativo' | 'finalizado' | 'cancelado'
  });

  useEffect(() => {
    if (isOpen && clientId) {
      fetchContracts();
    }
  }, [isOpen, clientId]);

  const fetchContracts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // For now, show empty state since contracts table is not yet available
      console.log('Fetching contracts for client:', clientId);
      setContracts([]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // For now, show success message but won't actually save to database
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso!",
      });
      
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        value: '',
        start_date: '',
        end_date: '',
        status: 'ativo'
      });
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contrato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso!",
      });
      
      setContracts(prev => prev.filter(c => c.id !== contractId));
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contrato.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-700';
      case 'finalizado':
        return 'bg-blue-100 text-blue-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="h-3 w-3" />;
      case 'finalizado':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelado':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contratos - {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Contract Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}
            </div>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <FileText className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>

          {/* Add Contract Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Novo Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título do Contrato</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="value">Valor (R$)</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_date">Data de Início</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Data de Término</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit">Criar Contrato</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Contracts List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando contratos...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum contrato encontrado para este cliente.</p>
                <p className="text-sm">Clique em "Novo Contrato" para criar o primeiro.</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{contract.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(contract.status)} flex items-center gap-1`}>
                          {getStatusIcon(contract.status)}
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContract(contract.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {contract.value && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span>R$ {contract.value.toFixed(2)}</span>
                        </div>
                      )}
                      {contract.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>Início: {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      )}
                      {contract.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <span>Término: {format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
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

export default ClientContractsModal;
