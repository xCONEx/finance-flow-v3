
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
      <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto">
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
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{client.description}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                <span>Cliente desde: {new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="hidden sm:inline">•</span>
                <span>{totalJobs} trabalho{totalJobs !== 1 ? 's' : ''}</span>
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
                    <DollarSign className="w-4 h-4" />
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Descrição</TableHead>
                        <TableHead className="min-w-[120px]">Data do Evento</TableHead>
                        <TableHead className="min-w-[100px]">Categoria</TableHead>
                        <TableHead className="min-w-[80px]">Horas</TableHead>
                        <TableHead className="min-w-[100px]">Dificuldade</TableHead>
                        <TableHead className="min-w-[120px]">Valor Final</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobHistory.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium truncate text-sm">{job.description}</div>
                              <div className="text-xs text-gray-500">
                                Criado em {new Date(job.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">
                                {job.event_date ? new Date(job.event_date).toLocaleDateString('pt-BR') : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{job.category || 'N/A'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{job.estimated_hours}h</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${getDifficultyColor(job.difficulty_level)}`}>
                              {job.difficulty_level}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-green-600 text-sm">
                                {formatCurrency(job.value_with_discount || job.total_costs)}
                              </div>
                              {job.discount_value > 0 && (
                                <div className="text-xs text-gray-500">
                                  Desc: {formatCurrency(job.discount_value)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(job.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
