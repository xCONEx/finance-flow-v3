
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, MapPin, Building, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Client, JobHistory } from '@/types/client';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ isOpen, onClose, client }) => {
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadJobHistory = async () => {
    if (!client) return;

    setLoading(true);
    try {
      // Usar dados mock para demonstração
      const mockHistory: JobHistory[] = [
        {
          id: '1',
          client_id: client.id,
          description: 'Ensaio fotográfico corporativo',
          service_value: 1500,
          event_date: '2024-01-15',
          status: 'aprovado',
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          client_id: client.id,
          description: 'Cobertura de evento empresarial',
          service_value: 2800,
          event_date: '2024-02-20',
          status: 'aprovado',
          created_at: '2024-02-15T14:30:00Z'
        }
      ];

      setJobHistory(mockHistory);
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
  }, [isOpen, client]);

  const totalValue = jobHistory.reduce((sum, job) => sum + job.service_value, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{client.email}</span>
                  </div>
                )}
              </div>

              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <span>{client.address}</span>
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
                  <p className="text-gray-600 dark:text-gray-400">{client.description}</p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Cliente desde: {new Date(client.created_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Trabalhos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Histórico de Trabalhos ({jobHistory.length})
                </CardTitle>
                {totalValue > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">
                      Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data do Evento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobHistory.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <div className="max-w-xs truncate">{job.description}</div>
                          </TableCell>
                          <TableCell>
                            {new Date(job.event_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              R$ {job.service_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={job.status === 'aprovado' ? 'default' : 'secondary'}
                            >
                              {job.status}
                            </Badge>
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
