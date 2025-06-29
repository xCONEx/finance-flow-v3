
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const ActivityTimeline = () => {
  const { jobs, tasks } = useApp();

  // Ensure arrays are always defined with safety checks
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  console.log('ActivityTimeline - arrays safety check:', { 
    jobs: safeJobs.length, 
    tasks: safeTasks.length 
  });

  // Combine and sort recent activities
  const recentActivities = [
    ...safeJobs.slice(0, 3).map(job => ({
      id: job.id,
      type: 'job' as const,
      title: job.description,
      status: job.status,
      date: job.eventDate,
      icon: job.status === 'concluído' ? CheckCircle : job.status === 'em_andamento' ? Clock : Calendar
    })),
    ...safeTasks.slice(0, 3).map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      status: task.completed ? 'concluído' : 'pendente',
      date: task.createdAt,
      icon: task.completed ? CheckCircle : task.priority === 'high' ? AlertCircle : Clock
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const getStatusColor = (status: string, type: string) => {
    if (type === 'task') {
      return status === 'concluído' ? 'text-green-600' : 'text-orange-600';
    }
    switch (status) {
      case 'concluído': return 'text-green-600';
      case 'em_andamento': return 'text-blue-600';
      case 'pendente': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string, type: string) => {
    if (type === 'task') {
      return status === 'concluído' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20';
    }
    switch (status) {
      case 'concluído': return 'bg-green-50 dark:bg-green-900/20';
      case 'em_andamento': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'pendente': return 'bg-gray-50 dark:bg-gray-900/20';
      default: return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getStatusBg(activity.status, activity.type)}`}>
                    <Icon className={`h-4 w-4 ${getStatusColor(activity.status, activity.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBg(activity.status, activity.type)} ${getStatusColor(activity.status, activity.type)}`}>
                        {activity.type === 'job' ? 'Job' : 'Tarefa'}: {activity.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
