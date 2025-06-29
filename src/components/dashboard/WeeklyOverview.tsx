import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePrivacy } from '@/contexts/PrivacyContext';

const WeeklyOverview = () => {
  const { jobs } = useApp();
  const { formatValue } = usePrivacy();

  // Ensure jobs is always an array
  const safeJobs = jobs || [];

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().slice(0, 10);
  }).reverse();

  const weeklyData = last7Days.map(date => {
    const dayJobs = safeJobs.filter(job => job.eventDate && job.eventDate.startsWith(date));
    const revenue = dayJobs.reduce((sum, job) => sum + (job.valueWithDiscount || 0), 0);
    const completedJobs = dayJobs.filter(job => job.status === 'aprovado').length;
    
    return {
      date,
      day: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      revenue,
      jobs: completedJobs
    };
  });

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-green-600">
            Receita: {formatValue(payload[0].value)}
          </p>
          <p className="text-blue-600">
            Jobs: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Visão Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip content={customTooltip} />
              <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatValue(weeklyData.reduce((sum, day) => sum + day.revenue, 0))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receita Semanal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {weeklyData.reduce((sum, day) => sum + day.jobs, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Jobs Concluídos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {weeklyData.filter(day => day.revenue > 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Dias Ativos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyOverview;
