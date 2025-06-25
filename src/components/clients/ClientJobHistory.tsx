
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';
import { Client } from '@/types/client';

interface Job {
  id: string;
  description: string;
  total_costs: number;
  status: string;
  event_date: string;
  created_at: string;
  category: string;
}

interface ClientJobHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

const ClientJobHistory: React.FC<ClientJobHistoryModalProps> = ({ isOpen, onClose, client }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, description, total_costs, status, event_date, created_at, category')
        .eq('client', client.name) // Using client name since we don't have client_id yet
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadJobHistory();
    }
  }, [isOpen, client.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const totalValue = jobs.reduce((sum, job) => sum + (job.total_costs || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Histórico de Trabalhos - {client.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {jobs.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {jobs.length} trabalho{jobs.length !== 1 ? 's' : ''} encontrado{jobs.length !== 1 ? 's' : ''}
              </span>
              <Badge variant="outline" className="text-green-600">
                Total: {formatCurrency(totalValue)}
              </Badge>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando histórico...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum trabalho registrado para este cliente ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1 truncate">
                          {job.description}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {job.category && (
                            <Badge variant="outline" className="text-xs">
                              {job.category}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {job.event_date ? 
                              new Date(job.event_date).toLocaleDateString('pt-BR') :
                              new Date(job.created_at).toLocaleDateString('pt-BR')
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {formatCurrency(job.total_costs || 0)}
                          </div>
                          <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                            {getStatusLabel(job.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientJobHistory;
