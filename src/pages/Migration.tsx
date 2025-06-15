
import React from 'react';
import { MigrationWizard } from '@/components/MigrationWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export const Migration: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Migração Firebase → Supabase</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transfira todos os seus dados do Firebase para o Supabase de forma segura e automática.
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Esta migração é segura e não afetará seus dados no Firebase. 
          Os dados serão copiados para o Supabase, mantendo o Firebase inalterado.
        </AlertDescription>
      </Alert>

      <MigrationWizard />

      <Card>
        <CardHeader>
          <CardTitle>Informações Técnicas</CardTitle>
          <CardDescription>
            Detalhes sobre o processo de migração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Como funciona a migração:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Conecta ao Firebase para ler seus dados existentes</li>
              <li>2. Transforma os dados para o formato do Supabase</li>
              <li>3. Insere os dados nas tabelas correspondentes no Supabase</li>
              <li>4. Verifica se a migração foi bem-sucedida</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Mapeamento de dados:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>Coleção "usuarios"</strong> → Tabela "profiles"</li>
              <li>• <strong>equipments[]</strong> → Tabela "equipment"</li>
              <li>• <strong>expenses[]</strong> → Tabela "expenses"</li>
              <li>• <strong>jobs[]</strong> → Tabela "jobs"</li>
              <li>• <strong>routine{}</strong> → Tabela "work_routine"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Migration;
