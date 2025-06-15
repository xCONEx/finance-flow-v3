
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Database, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { migrationService } from '@/services/migrationService';
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
  const { user: firebaseUser, isAuthenticated: firebaseAuth, loading: firebaseLoading } = useAuth();
  const { user: supabaseUser, isAuthenticated: supabaseAuth, loading: supabaseLoading } = useSupabaseAuth();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [checkingData, setCheckingData] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('🔍 MigrationWizard Debug:');
    console.log('Firebase User:', firebaseUser);
    console.log('Firebase Auth:', firebaseAuth);
    console.log('Firebase Loading:', firebaseLoading);
    console.log('Supabase User:', supabaseUser);
    console.log('Supabase Auth:', supabaseAuth);
    console.log('Supabase Loading:', supabaseLoading);
  }, [firebaseUser, firebaseAuth, firebaseLoading, supabaseUser, supabaseAuth, supabaseLoading]);

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

  const handleMigration = async () => {
    if (!firebaseUser || !supabaseUser) {
      console.error('Users not available for migration');
      return;
    }

    setMigrating(true);
    setMigrationComplete(false);

    try {
      const result = await migrationService.migrateUserData(
        firebaseUser.id,
        supabaseUser.id,
        setProgress
      );

      if (result.success) {
        setMigrationComplete(true);
        // Atualizar estatísticas após migração
        setTimeout(() => {
          checkMigrationData();
        }, 1000);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  // Mostrar loading se ainda carregando autenticação
  if (firebaseLoading || supabaseLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migração de Dados</CardTitle>
          <CardDescription>
            Verificando autenticação...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyData = migrationStats && Object.values(migrationStats).some(count => count > 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {migrationComplete || hasAnyData ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <AlertCircle className="h-6 w-6 text-orange-500" />
          )}
          Migração de Dados do Firebase para Supabase
        </CardTitle>
        <CardDescription>
          Este assistente irá migrar todos os seus dados do Firebase para o Supabase.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status de autenticação */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Status de Autenticação:
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${firebaseAuth ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Firebase: {firebaseAuth ? '✅ Conectado' : '❌ Não conectado'}</span>
              {firebaseUser && <span className="text-gray-500">({firebaseUser.email})</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${supabaseAuth ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Supabase: {supabaseAuth ? '✅ Conectado' : '❌ Não conectado'}</span>
              {supabaseUser && <span className="text-gray-500">({supabaseUser.email})</span>}
            </div>
          </div>
        </div>

        {/* Mostrar instruções se não autenticado */}
        {(!firebaseAuth || !supabaseAuth) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Autenticação necessária:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {!firebaseAuth && <li>• Faça login na aplicação (Firebase)</li>}
                {!supabaseAuth && <li>• A autenticação Supabase será configurada automaticamente</li>}
              </ul>
              <div className="mt-2">
                <Button onClick={() => window.location.href = '/login'} variant="outline" size="sm">
                  Ir para Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Status dos dados atuais - só mostrar se autenticado */}
        {supabaseAuth && migrationStats && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dados atuais no Supabase:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>• Perfil: {migrationStats.profiles > 0 ? '✅ Migrado' : '❌ Não migrado'}</div>
              <div>• Equipamentos: {migrationStats.equipment} itens</div>
              <div>• Despesas: {migrationStats.expenses} itens</div>
              <div>• Jobs: {migrationStats.jobs} itens</div>
              <div>• Rotina: {migrationStats.workRoutine > 0 ? '✅ Migrada' : '❌ Não migrada'}</div>
            </div>
            
            {checkingData && (
              <div className="mt-2 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                Verificando dados...
              </div>
            )}
          </div>
        )}

        {/* Informações sobre migração - só mostrar se ambos autenticados */}
        {firebaseAuth && supabaseAuth && (
          <>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Dados que serão migrados:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Perfil do usuário</li>
                  <li>• Equipamentos</li>
                  <li>• Despesas mensais</li>
                  <li>• Trabalhos/Jobs</li>
                  <li>• Rotina de trabalho</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Usuários identificados:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Firebase:</strong> {firebaseUser.email} (ID: {firebaseUser.id.substring(0, 8)}...)</p>
                  <p><strong>Supabase:</strong> {supabaseUser.email} (ID: {supabaseUser.id.substring(0, 8)}...)</p>
                </div>
              </div>
            </div>
          </>
        )}

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.step}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
            
            {progress.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{progress.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {migrationComplete && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Migração concluída com sucesso!</strong> Todos os seus dados foram transferidos para o Supabase.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            onClick={handleMigration}
            disabled={migrating || migrationComplete || !firebaseAuth || !supabaseAuth}
            className="flex-1"
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : migrationComplete ? (
              'Migração Concluída'
            ) : hasAnyData ? (
              'Migrar Novamente'
            ) : (
              'Iniciar Migração'
            )}
          </Button>

          {supabaseAuth && (
            <Button
              onClick={checkMigrationData}
              disabled={checkingData}
              variant="outline"
            >
              {checkingData ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verificar Dados'
              )}
            </Button>
          )}
        </div>

        {(migrationComplete || hasAnyData) && (
          <Alert>
            <AlertDescription>
              <strong>Próximos passos:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>1. Verifique se todos os dados foram migrados corretamente</li>
                <li>2. Teste as funcionalidades principais</li>
                <li>3. Quando tudo estiver funcionando, você pode desativar o Firebase</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationWizard;
