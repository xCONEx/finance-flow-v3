
import React, { useState } from 'react';
import { Edit, Trash2, FileText, Calendar, DollarSign, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '../contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useApp } from '../contexts/AppContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import JobEditor from './JobEditor';
import { toast } from '@/hooks/use-toast';
import { generateJobPDF } from '../utils/pdfGenerator';

const RecentJobs = () => {
  const { jobs, deleteJob } = useApp();
  const { user, profile } = useSupabaseAuth();
  const { formatValue } = usePrivacy();
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortOrder, setSortOrder] = useState<string>('recentes');
  const { currentTheme } = useTheme();

  console.log('🔍 RecentJobs - Debug inicial:', {
    jobsCount: jobs.length,
    userId: user?.id,
    userData: profile ? 'presente' : 'ausente'
  });

  // Ordenar jobs por data de criação (mais recentes primeiro)
  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.updatedAt);
    const dateB = new Date(b.createdAt || b.updatedAt);
    return dateB.getTime() - dateA.getTime();
  });

  const recentJobs = sortedJobs.slice(0, 3);

  // Filtrar e ordenar jobs para o histórico
  const getFilteredAndSortedJobs = () => {
    let filtered = [...jobs];
    
    // Filtrar por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt);
      const dateB = new Date(b.createdAt || b.updatedAt);
      
      if (sortOrder === 'recentes') {
        return dateB.getTime() - dateA.getTime(); // Mais recentes primeiro
      } else {
        return dateA.getTime() - dateB.getTime(); // Mais antigos primeiro
      }
    });
    
    return filtered;
  };

  const filteredJobs = getFilteredAndSortedJobs();

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
    console.log('🔧 Editando job:', jobId);
    setHistoryOpen(false);
    setEditingJob(jobId);
  };

  const handleDelete = async (jobId: string) => {
    try {
      console.log('🗑️ Deletando job:', jobId);
      await deleteJob(jobId);
      toast({
        title: "Job Excluído",
        description: "O job foi removido com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro ao excluir job:', error);
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

      await generateJobPDF(job, profile);
      toast({
        title: "PDF Gerado",
        description: "O PDF do orçamento foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do orçamento.",
        variant: "destructive"
      });
    }
  };

  const handleJobSaved = () => {
    setHistoryOpen(true);
  };

  const getSafeJobValue = (job: any) => {
    const value = job?.valueWithDiscount || job?.serviceValue || 0;
    console.log('💰 getSafeJobValue para job:', job.id, 'valor:', value);
    return Number(value) || 0;
  };

  if (recentJobs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start mb-4 mt-2">
          <h3 className="text-2xl font-bold text-gray-900">Últimos Jobs Calculados</h3>
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button  size="sm" 
              className={`bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 transition-all duration-300 hover:scale-105`} >
                <Eye className="h-4 w-4 mr-2" />
                Ver Histórico
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Histórico Completo de Jobs</DialogTitle>
                <DialogDescription>
                  Visualize todos os jobs calculados anteriormente
                </DialogDescription>
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
      <div className="flex justify-between items-start mb-8 mt-6">
        <CardTitle>Últimos Jobs Calculados</CardTitle>
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button size="sm" 
              className={`bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 transition-all duration-300 hover:scale-105`}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico Completo de Jobs</DialogTitle>
              <DialogDescription>
                Visualize e gerencie todos os jobs calculados anteriormente
              </DialogDescription>
            </DialogHeader>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Ordenação</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentes">Mais Recentes</SelectItem>
                    <SelectItem value="antigos">Mais Antigos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 p-2">
              {filteredJobs.map((job) => (
                <div key={`history-${job.id}`} className="p-3 md:p-4 border rounded-lg space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h4 className="font-medium flex-1">{job.description}</h4>
                    <div className="flex items-center gap-2">
                      {(job as any).isManual && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Manual
                        </Badge>
                      )}
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{job.client || 'Cliente não informado'}</p>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(job.eventDate).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatValue(getSafeJobValue(job))}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(job.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintPDF(job.id)}
                      className="text-green-600 hover:text-green-700 text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
              {filteredJobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum job encontrado com os filtros selecionados</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {recentJobs.map((job) => (
        <div key={`recent-${job.id}`} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
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
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(job.id)}
              className="text-blue-600 hover:text-blue-700 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintPDF(job.id)}
              className="text-green-600 hover:text-green-700 text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(job.id)}
              className="text-red-600 hover:text-red-700 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      ))}

      {editingJob && (
        <JobEditor
          jobId={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={handleJobSaved}
        />
      )}
    </div>
  );
};

export default RecentJobs;
