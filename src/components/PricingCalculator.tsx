import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/client';

const PricingCalculator = () => {
  const [jobData, setJobData] = useState({
    description: '',
    client: '',
    eventDate: new Date().toISOString().split('T')[0],
    estimatedHours: 1,
    difficultyLevel: 'médio' as 'fácil' | 'médio' | 'complicado' | 'difícil',
    logistics: 0,
    equipment: 0,
    assistance: 0,
    category: 'Ensaio Fotográfico',
    discountValue: 0,
    totalCosts: 0,
    serviceValue: 0,
    valueWithDiscount: 0,
    profitMargin: 0,
    is_approved: false,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);

  const [costs, setCosts] = useState(0);
  const [finalValue, setFinalValue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, profile, agency } = useSupabaseAuth();
  const { toast } = useToast();

  const difficultyLevels: ('fácil' | 'médio' | 'complicado' | 'difícil')[] = ['fácil', 'médio', 'complicado', 'difícil'];
  const jobCategories = [
    'Ensaio Fotográfico',
    'Casamento',
    'Aniversário/Festa',
    'Corporativo/Empresarial',
    'Book Pessoal',
    'Evento Social',
    'Produto/Comercial',
    'Arquitetônico',
    'Newborn/Gestante',
    'Edição de Vídeo',
    'Design Gráfico',
    'Consultoria',
    'Curso/Workshop',
    'Aluguel de Equipamento',
    'Outros Serviços'
  ];

  const loadClients = async () => {
    if (!user) return;

    try {
      // Use dados mock enquanto a tabela clients não está disponível
      let clientsData: Client[] = [];
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);

        if (error) {
          console.log('Tabela clients não encontrada, usando dados mock');
          clientsData = [];
        } else {
          clientsData = [];
        }
      } catch (dbError) {
        console.log('Erro ao acessar database, usando dados mock');
        clientsData = [];
      }

      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  useEffect(() => {
    loadClients();
  }, [user, agency]);

  useEffect(() => {
    calculateCosts();
    calculateFinalValue();
    calculateProfit();
  }, [jobData]);

  const calculateCosts = () => {
    const logisticsCost = parseFloat(jobData.logistics?.toString() || '0');
    const equipmentCost = parseFloat(jobData.equipment?.toString() || '0');
    const assistanceCost = parseFloat(jobData.assistance?.toString() || '0');
    setCosts(logisticsCost + equipmentCost + assistanceCost);
  };

  const calculateFinalValue = () => {
    const estimatedHours = parseFloat(jobData.estimatedHours?.toString() || '0');
    let baseValue = 0;

    switch (jobData.difficultyLevel) {
      case 'fácil':
        baseValue = 100 * estimatedHours;
        break;
      case 'médio':
        baseValue = 200 * estimatedHours;
        break;
      case 'complicado':
        baseValue = 300 * estimatedHours;
        break;
      case 'difícil':
        baseValue = 400 * estimatedHours;
        break;
      default:
        baseValue = 200 * estimatedHours;
    }

    const totalCosts = parseFloat(jobData.totalCosts?.toString() || '0');
    const serviceValue = baseValue + costs + totalCosts;
    jobData.serviceValue = serviceValue;

    const discountValue = parseFloat(jobData.discountValue?.toString() || '0');
    const valueWithDiscount = serviceValue - discountValue;
    jobData.valueWithDiscount = valueWithDiscount;

    setFinalValue(valueWithDiscount);
  };

  const calculateProfit = () => {
    const profit = finalValue - costs - parseFloat(jobData.totalCosts?.toString() || '0');
    jobData.profitMargin = profit;
    setProfit(profit);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setJobData({ ...jobData, client: client.name });
    setShowClientSearch(false);
  };

  const clearClientSelection = () => {
    setSelectedClient(null);
    setJobData({ ...jobData, client: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!jobData.description.trim() || !jobData.client.trim()) {
      toast({
        title: "Erro",
        description: "Descrição e Cliente são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          description: jobData.description,
          client: jobData.client,
          event_date: jobData.eventDate,
          estimated_hours: jobData.estimatedHours,
          difficulty_level: jobData.difficultyLevel,
          logistics: jobData.logistics,
          equipment: jobData.equipment,
          assistance: jobData.assistance,
          category: jobData.category,
          discount_value: jobData.discountValue,
          total_costs: jobData.totalCosts,
          service_value: jobData.serviceValue,
          value_with_discount: jobData.valueWithDiscount,
          profit_margin: jobData.profitMargin,
          is_approved: jobData.is_approved,
          user_id: user.id,
          agency_id: agency?.id || null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Job adicionado com sucesso!",
      });

      setJobData({
        description: '',
        client: '',
        eventDate: new Date().toISOString().split('T')[0],
        estimatedHours: 1,
        difficultyLevel: 'médio',
        logistics: 0,
        equipment: 0,
        assistance: 0,
        category: 'Ensaio Fotográfico',
        discountValue: 0,
        totalCosts: 0,
        serviceValue: 0,
        valueWithDiscount: 0,
        profitMargin: 0,
        is_approved: false,
      });
      setSelectedClient(null);
    } catch (error) {
      console.error('Erro ao adicionar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar job. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calculadora de Preços
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Calcule o valor dos seus serviços de forma rápida e fácil
          </p>
        </div>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Calculando...' : 'Salvar Job'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Dados do Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="client"
                    placeholder="Nome do cliente"
                    value={jobData.client}
                    onChange={(e) => {
                      setJobData({ ...jobData, client: e.target.value });
                      if (selectedClient && e.target.value !== selectedClient.name) {
                        setSelectedClient(null);
                      }
                    }}
                    required
                  />
                  {selectedClient && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="text-sm">
                          <div className="font-medium">{selectedClient.name}</div>
                          {selectedClient.phone && (
                            <div className="text-gray-600 dark:text-gray-400">
                              📞 {selectedClient.phone}
                            </div>
                          )}
                          {selectedClient.email && (
                            <div className="text-gray-600 dark:text-gray-400">
                              ✉️ {selectedClient.email}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearClientSelection}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClientSearch(true)}
                  className="px-3"
                >
                  🔍
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descrição do trabalho"
                value={jobData.description}
                onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do Evento *</Label>
              <Input
                id="eventDate"
                type="date"
                value={jobData.eventDate}
                onChange={(e) => setJobData({ ...jobData, eventDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas *</Label>
              <Input
                id="estimatedHours"
                type="number"
                placeholder="Horas estimadas para o trabalho"
                value={jobData.estimatedHours}
                onChange={(e) => setJobData({ ...jobData, estimatedHours: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Nível de Dificuldade *</Label>
              <Select
                value={jobData.difficultyLevel}
                onValueChange={(value: 'fácil' | 'médio' | 'complicado' | 'difícil') => setJobData({ ...jobData, difficultyLevel: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={jobData.category}
                onValueChange={(value) => setJobData({ ...jobData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {jobCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logistics">Logística (R$)</Label>
              <CurrencyInput
                id="logistics"
                placeholder="Custos com logística"
                value={jobData.logistics}
                onChange={(value) => setJobData({ ...jobData, logistics: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamento (R$)</Label>
              <CurrencyInput
                id="equipment"
                placeholder="Custos com equipamento"
                value={jobData.equipment}
                onChange={(value) => setJobData({ ...jobData, equipment: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistance">Assistência (R$)</Label>
              <CurrencyInput
                id="assistance"
                placeholder="Custos com assistência"
                value={jobData.assistance}
                onChange={(value) => setJobData({ ...jobData, assistance: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountValue">Desconto (R$)</Label>
              <CurrencyInput
                id="discountValue"
                placeholder="Valor do desconto"
                value={jobData.discountValue}
                onChange={(value) => setJobData({ ...jobData, discountValue: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCosts">Custos Totais (R$)</Label>
              <CurrencyInput
                id="totalCosts"
                placeholder="Custos adicionais"
                value={jobData.totalCosts}
                onChange={(value) => setJobData({ ...jobData, totalCosts: value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_approved"
                checked={jobData.is_approved}
                onCheckedChange={(checked) => setJobData({ ...jobData, is_approved: !!checked })}
              />
              <Label htmlFor="is_approved">Marcar como aprovado</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Valor do Serviço (R$)</Label>
              <Input
                value={jobData.serviceValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Custos (R$)</Label>
              <Input
                value={costs?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Final (R$)</Label>
              <Input
                value={finalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Margem de Lucro (R$)</Label>
              <Input
                value={profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showClientSearch} onOpenChange={setShowClientSearch}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum cliente cadastrado.</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setShowClientSearch(false);
                  }}
                >
                  Cadastrar Cliente
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="font-medium">{client.name}</div>
                    {client.phone && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        📞 {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ✉️ {client.email}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingCalculator;
