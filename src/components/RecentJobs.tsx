
import React, { useState } from 'react';
import { Edit, Trash2, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '../contexts/AppContext';
import JobEditor from './JobEditor';
import { toast } from '@/hooks/use-toast';

const RecentJobs = () => {
  const { jobs, deleteJob } = useAppContext();
  const [editingJob, setEditingJob] = useState<string | null>(null);

  const recentJobs = jobs.slice(0, 3);

  const handleEdit = (jobId: string) => {
    setEditingJob(jobId);
  };

  const handleDelete = (jobId: string) => {
    deleteJob(jobId);
    toast({
      title: "Job Excluído",
      description: "O job foi removido com sucesso.",
    });
  };

  const handlePrintPDF = (jobId: string) => {
    // TODO: Implementar geração de PDF
    toast({
      title: "PDF em desenvolvimento",
      description: "A funcionalidade de PDF será implementada em breve.",
    });
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
