
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Calendar, Users } from 'lucide-react';
import MonthlyCosts from './MonthlyCosts';
import WorkItems from './WorkItems';
import WorkRoutine from './WorkRoutine';
import AgencyCollaborators from './AgencyCollaborators';

const ManagementSection = () => {
  const [activeTab, setActiveTab] = useState('costs');

  return (
   <div className="p-4 sm:p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gerenciamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Gerencie seus custos, itens, rotina de trabalho e colaboradores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="costs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Custos</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Package className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Itens</span>
          </TabsTrigger>
          <TabsTrigger value="routine" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Calendar className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Rotina</span>
          </TabsTrigger>
          <TabsTrigger value="collaborators" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Users className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Colaboradores</span>
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

        <TabsContent value="collaborators" className="mt-6">
          <AgencyCollaborators />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagementSection;
