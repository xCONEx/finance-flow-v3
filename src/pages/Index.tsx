
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, ArrowRight } from 'lucide-react';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Card de migração na parte superior */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="h-5 w-5" />
            Migração Firebase → Supabase
          </CardTitle>
          <CardDescription className="text-blue-600">
            Transfira seus dados do Firebase para o Supabase de forma segura e automática.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/migration')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Acessar Migração
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard existente */}
      <Dashboard />
    </div>
  );
};

export default Index;
