import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';
import { Client } from '@/types/client';

interface Job {
  id: string;
  description: string;
  service_value: number;
  total_costs: number;
  status: string;
  event_date: string;
  created_at: string;
  category: string;
}

interface ClientJobHistoryProps {
  client: Client;
}

export const ClientJobHistory: React.FC<ClientJobHistoryProps> = ({ client }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, description, service_value, total_costs, status, event_date, created_at, category')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobHistory();
  }, [client.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluído':
        return 'bg-green-100 text-green-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluído':
        return 'Concluído';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const totalValue = jobs.reduce((sum, job) => sum + job.total_costs, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Trabalhos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Histórico de Trabalhos</span>
          {jobs.length > 0 && (
            <Badge variant="outline" className="text-green-600">
              Total: {formatCurrency(totalValue)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhum trabalho registrado para este cliente ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
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
                        {formatCurrency(job.total_costs)}
                      </div>
                      <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
