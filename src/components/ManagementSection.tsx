
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Calendar } from 'lucide-react';
import MonthlyCosts from './MonthlyCosts';
import WorkItems from './WorkItems';
import WorkRoutine from './WorkRoutine';

const ManagementSection = () => {
  const [activeTab, setActiveTab] = useState('costs');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gerenciamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie seus custos, itens e rotina de trabalho
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Itens
          </TabsTrigger>
          <TabsTrigger value="routine" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Rotina
          </TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="mt-6">
          <MonthlyCosts />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <WorkItems />
        </TabsContent>

        <TabsContent value="routine" className="mt-6">
          <WorkRoutine />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagementSection;
