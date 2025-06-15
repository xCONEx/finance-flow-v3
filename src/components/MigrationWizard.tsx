
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { migrationService } from '@/services/migrationService';

interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  completed: boolean;
  error?: string;
}

export const MigrationWizard: React.FC = () => {
  const { user: firebaseUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);

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
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  if (!firebaseUser || !supabaseUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migração de Dados</CardTitle>
          <CardDescription>
            Você precisa estar logado em ambos os sistemas para realizar a migração.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {migrationComplete ? (
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

        <div className="flex gap-3">
          <Button
            onClick={handleMigration}
            disabled={migrating || migrationComplete}
            className="flex-1"
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : migrationComplete ? (
              'Migração Concluída'
            ) : (
              'Iniciar Migração'
            )}
          </Button>
        </div>

        {migrationComplete && (
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
