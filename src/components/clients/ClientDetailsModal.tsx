
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, MapPin, Building, Calendar, DollarSign, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { formatCurrency } from '@/utils/formatters';

interface JobHistory {
  id: string;
  description: string;
  client: string;
  service_value: number;
  total_costs: number;
  value_with_discount: number;
  event_date: string;
  status: string;
  estimated_hours: number;
  difficulty_level: string;
  category: string;
  discount_value: number;
  created_at: string;
}

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ isOpen, onClose, client }) => {
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const loadJobHistory = async () => {
    if (!client || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('client', client.name)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setJobHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de trabalhos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && client) {
      loadJobHistory();
    }
  }, [isOpen, client, user]);

  const totalValue = jobHistory.reduce((sum, job) => sum + (job.value_with_discount || job.total_costs), 0);
  const totalJobs = jobHistory.length;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { variant: 'secondary' as const, label: 'Pendente' },
      'aprovado': { variant: 'default' as const, label: 'Aprovado' },
      'em-andamento': { variant: 'outline' as const, label: 'Em Andamento' },
      'concluido': { variant: 'default' as const, label: 'Concluído' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'fácil': return 'text-green-600';
      case 'médio': return 'text-yellow-600';
      case 'complicado': return 'text-orange-600';
      case 'difícil': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
    <DialogHeader>
      <DialogTitle className="text-blue-600">Detalhes do Cliente</DialogTitle>
    </DialogHeader>

    <div className="space-y-6">
      {/* Informações do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {client.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{client.email}</span>
              </div>
            )}
          </div>

          {client.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-1" />
              <span className="text-sm">{client.address}</span>
            </div>
          )}

          {client.cnpj && (
            <div>
              <Badge variant="outline">{client.cnpj}</Badge>
            </div>
          )}

          {client.description && (
            <div>
              <h4 className="font-medium mb-2">Descrição:</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {client.description}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
            <span>
              Cliente desde: {new Date(client.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              {totalJobs} trabalho{totalJobs !== 1 ? 's' : ''}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Total faturado: {formatCurrency(totalValue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Trabalhos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico de Trabalhos ({totalJobs})
            </CardTitle>
            {totalValue > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                
                <span className="font-semibold text-sm sm:text-base">
                  Total: {formatCurrency(totalValue)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando histórico...</div>
          ) : jobHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum trabalho encontrado para este cliente.</p>
            </div>
          ) : (
            <>
              {/* Tabela no Desktop */}
              <div className="hidden sm:block">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data do Evento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Dificuldade</TableHead>
                      <TableHead>Valor Final</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobHistory.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Criado em {new Date(job.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.event_date
                            ? new Date(job.event_date).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{job.category || 'N/A'}</TableCell>
                        <TableCell>{job.estimated_hours}h</TableCell>
                        <TableCell>{job.difficulty_level}</TableCell>
                        <TableCell>
                          <div className="text-green-600 font-medium">
                            {formatCurrency(job.value_with_discount || job.total_costs)}
                          </div>
                          {job.discount_value > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Desc: {formatCurrency(job.discount_value)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Lista no Mobile */}
              <div className="sm:hidden space-y-4">
                {jobHistory.map((job) => (
                  <div
                    key={job.id}
                    className="border rounded-lg p-4 bg-background shadow-sm space-y-2"
                  >
                    <div>
                      <span className="font-semibold">Descrição:</span> {job.description}
                    </div>
                    <div>
                      <span className="font-semibold">Data do Evento:</span>{' '}
                      {job.event_date
                        ? new Date(job.event_date).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Categoria:</span> {job.category || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Horas:</span> {job.estimated_hours}h
                    </div>
                    <div>
                      <span className="font-semibold">Dificuldade:</span> {job.difficulty_level}
                    </div>
                    <div>
                      <span className="font-semibold">Valor Final:</span>{' '}
                      <span className="text-green-600 font-medium">
                        {formatCurrency(job.value_with_discount || job.total_costs)}
                      </span>
                      {job.discount_value > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Desc: {formatCurrency(job.discount_value)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span> {getStatusBadge(job.status)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
  );
};
