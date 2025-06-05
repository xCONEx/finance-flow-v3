
import React, { useState } from 'react';
import { Edit, Trash2, FileText, Calendar, DollarSign, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import JobEditor from './JobEditor';
import { toast } from '@/hooks/use-toast';
import { generateJobPDF } from '../utils/pdfGenerator';

const RecentJobs = () => {
  const { jobs, deleteJob } = useAppContext();
  const { userData } = useAuth();
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const recentJobs = jobs.slice(0, 3);

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

  if (recentJobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 mb-4" />
        <p>Nenhum job calculado ainda</p>
        <p className="text-sm">Use a calculadora para criar seu primeiro orçamento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Últimos Jobs Calculados</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-1"
        >
          <History className="h-4 w-4" />
          Ver Histórico
        </Button>
      </div>

      {recentJobs.map((job) => (
        <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">{job.description}</h3>
              <p className="text-sm text-gray-600">Cliente: {job.client}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(job.eventDate).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  R$ {job.serviceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* Modal de Histórico */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico Completo de Jobs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum job encontrado</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{job.description}</h4>
                      <p className="text-sm text-gray-600">Cliente: {job.client}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(job.eventDate).toLocaleDateString('pt-BR')} - 
                        R$ {job.serviceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant={job.status === 'aprovado' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => {
                      setShowHistoryModal(false);
                      handleEdit(job.id);
                    }}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrintPDF(job.id)}>
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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
