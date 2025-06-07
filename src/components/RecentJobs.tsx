
import React, { useState } from 'react';
import { Edit, Trash2, FileText, Calendar, DollarSign, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import JobEditor from './JobEditor';
import { toast } from '@/hooks/use-toast';
import { generateJobPDF } from '../utils/pdfGenerator';

const RecentJobs = () => {
  const { jobs, deleteJob } = useAppContext();
  const { userData } = useAuth();
  const { formatValue } = usePrivacy();
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recentJobs = jobs.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (jobId: string) => {
    setEditingJob(jobId);
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      toast({
        title: "Job Excluído",
        description: "O job foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir job.",
        variant: "destructive"
      });
    }
  };

  const handlePrintPDF = async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        toast({
          title: "Erro",
          description: "Job não encontrado.",
          variant: "destructive"
        });
        return;
      }

      await generateJobPDF(job, userData);
      toast({
        title: "PDF Gerado",
        description: "O PDF do orçamento foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do orçamento.",
        variant: "destructive"
      });
    }
  };

  // CORRIGIDO: Função helper para garantir valores seguros
  const getSafeJobValue = (job: any) => {
    return job.valueWithDiscount || job.serviceValue || 0;
  };

  if (recentJobs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Últimos Jobs Calculados</h3>
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver Histórico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Histórico Completo de Jobs</DialogTitle>
              </DialogHeader>
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum job encontrado</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>Nenhum job calculado ainda</p>
          <p className="text-sm">Use a calculadora para criar seu primeiro orçamento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Últimos Jobs Calculados</h3>
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico Completo de Jobs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{job.description}</h4>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{job.client || 'Cliente não informado'}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(job.eventDate).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.estimatedHours || 0}h
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatValue(getSafeJobValue(job))}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(job.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintPDF(job.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum job encontrado</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {recentJobs.map((job) => (
        <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">{job.description}</h3>
              <p className="text-sm text-gray-600">{job.client || 'Cliente não informado'}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(job.eventDate).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatValue(getSafeJobValue(job))}
                </span>
              </div>
            </div>
            <Badge variant={job.status === 'aprovado' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(job.id)}>
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDelete(job.id)}>
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
            <Button size="sm" variant="outline" onClick={() => handlePrintPDF(job.id)}>
              <FileText className="h-3 w-3 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      ))}

      {editingJob && (
        <JobEditor
          jobId={editingJob}
          onClose={() => setEditingJob(null)}
        />
      )}
    </div>
  );
};

export default RecentJobs;
