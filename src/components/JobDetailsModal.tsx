import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Clock, User, FileText, Edit, Trash2, X } from 'lucide-react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { Job } from '../types';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onPrintPDF?: (jobId: string) => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  onEdit,
  onDelete,
  onPrintPDF
}) => {
  const { formatValue } = usePrivacy();

  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'fácil': return 'text-green-600 dark:text-green-400';
      case 'médio': return 'text-yellow-600 dark:text-yellow-400';
      case 'complicado': return 'text-orange-600 dark:text-orange-400';
      case 'difícil': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Detalhes do Job</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{job.description}</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{job.client || 'Cliente não informado'}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data do Evento</p>
                    <p className="text-sm text-muted-foreground">{formatDate(job.eventDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Horas Estimadas</p>
                    <p className="text-sm text-muted-foreground">{job.estimatedHours}h</p>
                  </div>
                </div>
              </div>

              {job.category && (
                <div>
                  <p className="text-sm font-medium mb-1">Categoria</p>
                  <Badge variant="outline">{job.category}</Badge>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Nível de Dificuldade</p>
                <span className={`text-sm ${getDifficultyColor(job.difficultyLevel)}`}>
                  {job.difficultyLevel}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Custos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valores e Custos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valor do Serviço</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatValue(job.serviceValue)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valor com Desconto</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatValue(job.valueWithDiscount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Logística</p>
                  <p className="text-sm text-muted-foreground">{formatValue(job.logistics)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Equipamentos</p>
                  <p className="text-sm text-muted-foreground">{formatValue(job.equipment)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Assistência</p>
                  <p className="text-sm text-muted-foreground">{formatValue(job.assistance)}</p>
                </div>
              </div>

              {job.discountValue > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Desconto Aplicado</p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    -{formatValue(job.discountValue)}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Total de Custos</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatValue(job.totalCosts)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Margem de Lucro</p>
                  <p className="text-sm text-muted-foreground">{job.profitMargin}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Criado em</p>
                  <p className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</p>
                </div>
              </div>
              {job.updatedAt !== job.createdAt && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Última Atualização</p>
                  <p className="text-sm text-muted-foreground">{formatDate(job.updatedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 justify-end">
            {onEdit && (
              <Button
                onClick={() => onEdit(job.id)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
            {onPrintPDF && (
              <Button
                onClick={() => onPrintPDF(job.id)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Gerar PDF
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(job.id)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal; 
