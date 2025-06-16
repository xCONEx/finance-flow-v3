
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Database, User } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  completed: boolean;
  error?: string;
}

interface MigrationStats {
  profiles: number;
  equipment: number;
  expenses: number;
  jobs: number;
  workRoutine: number;
}

export const MigrationWizard: React.FC = () => {
  const { user: supabaseUser, isAuthenticated: supabaseAuth, loading: supabaseLoading } = useSupabaseAuth();
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [checkingData, setCheckingData] = useState(false);

  const checkMigrationData = async () => {
    if (!supabaseUser) return;
    
    setCheckingData(true);
    try {
      const stats: MigrationStats = {
        profiles: 0,
        equipment: 0,
        expenses: 0,
        jobs: 0,
        workRoutine: 0
      };

      // Verificar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      if (profile) stats.profiles = 1;

      // Verificar equipamentos
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id')
        .eq('user_id', supabaseUser.id);
      stats.equipment = equipment?.length || 0;

      // Verificar despesas
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', supabaseUser.id);
      stats.expenses = expenses?.length || 0;

      // Verificar jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', supabaseUser.id);
      stats.jobs = jobs?.length || 0;

      // Verificar rotina
      const { data: routine } = await supabase
        .from('work_routine')
        .select('id')
        .eq('user_id', supabaseUser.id);
      stats.workRoutine = routine?.length || 0;

      setMigrationStats(stats);
    } catch (error) {
      console.error('Erro ao verificar dados:', error);
    } finally {
      setCheckingData(false);
    }
  };

  useEffect(() => {
    if (supabaseUser) {
      checkMigrationData();
    }
  }, [supabaseUser]);

  // Simplified migration wizard since Firebase context was removed
  const hasAnyData = migrationStats && Object.values(migrationStats).some(count => count > 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Sistema Migrado para Supabase
        </CardTitle>
        <CardDescription>
          O sistema já foi migrado para usar o Supabase como backend principal.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-green-800 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sistema Atualizado:
          </h4>
          <p className="text-sm text-green-700">
            Todas as funcionalidades principais agora usam o Supabase como backend.
          </p>
        </div>

        {supabaseAuth && migrationStats && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dados no Supabase:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>• Perfil: {migrationStats.profiles > 0 ? '✅ Presente' : '❌ Não encontrado'}</div>
              <div>• Equipamentos: {migrationStats.equipment} itens</div>
              <div>• Despesas: {migrationStats.expenses} itens</div>
              <div>• Jobs: {migrationStats.jobs} itens</div>
            </div>
          </div>
        )}

        <Alert>
          <AlertDescription>
            <strong>Sistema Atualizado:</strong> A migração para Supabase foi concluída.
            Todas as novas funcionalidades usam o banco de dados Supabase.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default MigrationWizard;
