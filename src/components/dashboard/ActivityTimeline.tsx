
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const ActivityTimeline = () => {
  const { jobs, tasks } = useApp();

  // CRITICAL FIX: Force safe array initialization with comprehensive logging
  const safeJobs = React.useMemo(() => {
    console.log('ActivityTimeline - jobs debug:', { 
      jobs: jobs ? 'defined' : 'undefined',
      type: typeof jobs,
      isArray: Array.isArray(jobs),
      length: Array.isArray(jobs) ? jobs.length : 'N/A',
      firstItem: Array.isArray(jobs) && jobs.length > 0 ? jobs[0] : 'none'
    });
    
    if (!jobs || !Array.isArray(jobs)) {
      console.log('ActivityTimeline - Returning empty jobs array');
      return [];
    }
    return jobs;
  }, [jobs]);

  const safeTasks = React.useMemo(() => {
    console.log('ActivityTimeline - tasks debug:', { 
      tasks: tasks ? 'defined' : 'undefined',
      type: typeof tasks,
      isArray: Array.isArray(tasks),
      length: Array.isArray(tasks) ? tasks.length : 'N/A',
      firstItem: Array.isArray(tasks) && tasks.length > 0 ? tasks[0] : 'none'
    });
    
    if (!tasks || !Array.isArray(tasks)) {
      console.log('ActivityTimeline - Returning empty tasks array');
      return [];
    }
    return tasks;
  }, [tasks]);

  // Combine and sort recent activities with extra safety
  const recentActivities = React.useMemo(() => {
    console.log('ActivityTimeline - Building recent activities:', {
      safeJobsLength: safeJobs.length,
      safeTasksLength: safeTasks.length
    });

    const jobActivities = safeJobs.slice(0, 3).map(job => {
      // Add safety check for job object
      if (!job || typeof job !== 'object') {
        console.log('ActivityTimeline - Invalid job object:', job);
        return null;
      }
      
      return {
        id: job.id || `job-${Date.now()}`,
        type: 'job' as const,
        title: job.description || 'Job sem descrição',
        status: job.status || 'pendente',
        date: job.eventDate || job.createdAt || new Date().toISOString(),
        icon: job.status === 'concluído' ? CheckCircle : job.status === 'em_andamento' ? Clock : Calendar
      };
    }).filter(Boolean); // Remove null entries

    const taskActivities = safeTasks.slice(0, 3).map(task => {
      // Add safety check for task object
      if (!task || typeof task !== 'object') {
        console.log('ActivityTimeline - Invalid task object:', task);
        return null;
      }
      
      return {
        id: task.id || `task-${Date.now()}`,
        type: 'task' as const,
        title: task.title || 'Tarefa sem título',
        status: task.completed ? 'concluído' : 'pendente',
        date: task.createdAt || new Date().toISOString(),
        icon: task.completed ? CheckCircle : task.priority === 'high' ? AlertCircle : Clock
      };
    }).filter(Boolean); // Remove null entries

    const combined = [...jobActivities, ...taskActivities];
    const sorted = combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.slice(0, 5);
  }, [safeJobs, safeTasks]);

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
              if (!activity) return null;
              
              const Icon = activity.icon;
              return (
                <div key={`${activity.id}-${index}`} className="flex items-start gap-3">
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
