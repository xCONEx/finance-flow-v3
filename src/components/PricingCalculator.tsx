
import React, { useState, useEffect } from 'react';
import { Calculator, Save, DollarSign, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentageInput } from '@/components/ui/percentage-input';
import { toast } from '@/hooks/use-toast';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { formatCurrency } from '../utils/formatters';
import ManualValueModal from './ManualValueModal';
import { ClientSelector } from './clients/ClientSelector';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
}

const PricingCalculator = () => {
  const { addJob, workRoutine, refreshJobs } = useApp();
  const { currentTheme } = useTheme();
  const { user } = useSupabaseAuth();
  const [showManualValue, setShowManualValue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    eventDate: '',
    estimatedHours: 0,
    difficultyLevel: 'médio' as 'fácil' | 'médio' | 'complicado' | 'difícil',
    logisticsValue: 0,
    equipmentValue: 0,
    assistanceValue: 0,
    category: '',
    discountPercentage: 0
  });

  const [calculatedPrice, setCalculatedPrice] = useState({
    totalCosts: 0,
    serviceValue: 0,
    valueWithDiscount: 0,
    hourlyRate: 0,
    additionalCosts: 0
  });

  const jobCategories = [
    "Filmagem de Casamento",
    "Vídeo Institucional", 
    "Clipe Musical",
    "Reels/TikTok",
    "VSL (Video Sales Letter)",
    "Edição Simples",
    "Edição Complexa",
    "Motion Graphics"
  ];

  const calculatePrice = () => {
    if (!workRoutine) {
      toast({
        title: "Erro",
        description: "Configure sua rotina de trabalho primeiro.",
        variant: "destructive"
      });
      return;
    }

    if (formData.estimatedHours <= 0) {
      toast({
        title: "Erro", 
        description: "Informe as horas estimadas.",
        variant: "destructive"
      });
      return;
    }

    // Valor base por hora (E36 na planilha)
    const baseHourlyRate = workRoutine.valuePerHour;
    
    // Horas estimadas (C11 na planilha)
    const estimatedHours = formData.estimatedHours;

    // Cálculo conforme a planilha Excel
    let serviceValue = 0;
    
    switch (formData.difficultyLevel) {
      case 'fácil':
        serviceValue = baseHourlyRate * estimatedHours; // Sem multiplicador
        break;
      case 'médio':
        serviceValue = baseHourlyRate * estimatedHours; // Sem multiplicador
        break;
      case 'complicado':
        serviceValue = baseHourlyRate * estimatedHours * 1.5; // 50% a mais
        break;
      case 'difícil':
        serviceValue = baseHourlyRate * estimatedHours * 2.0; // 100% a mais
        break;
      default:
        serviceValue = baseHourlyRate * estimatedHours;
    }

    // Custos adicionais
    const additionalCosts = formData.logisticsValue + formData.equipmentValue + formData.assistanceValue;

    // Valor total = valor do serviço + custos adicionais
    const totalCosts = serviceValue + additionalCosts;

    // Aplicar desconto se houver
    const discountAmount = (totalCosts * formData.discountPercentage) / 100;
    const valueWithDiscount = totalCosts - discountAmount;
    
    setCalculatedPrice({
      totalCosts,
      serviceValue,
      valueWithDiscount,
      hourlyRate: baseHourlyRate,
      additionalCosts
    });

    toast({
      title: "Preço Calculado!",
      description: "O orçamento foi calculado conforme sua planilha.",
    });
  };

  const saveJob = async () => {
    if (!formData.description || !selectedClient || calculatedPrice.totalCosts === 0) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (descrição, cliente) e calcule o preço primeiro.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    const newJob = {
      description: formData.description,
      client: selectedClient.name,
      client_id: selectedClient.id,
      eventDate: formData.eventDate || new Date().toISOString().split('T')[0],
      estimatedHours: formData.estimatedHours,
      difficultyLevel: formData.difficultyLevel,
      logistics: formData.logisticsValue,
      equipment: formData.equipmentValue,
      assistance: formData.assistanceValue,
      status: 'pendente' as const,
      category: formData.category,
      discountValue: (calculatedPrice.totalCosts * formData.discountPercentage) / 100,
      totalCosts: calculatedPrice.totalCosts,
      serviceValue: calculatedPrice.serviceValue,
      valueWithDiscount: calculatedPrice.valueWithDiscount,
      profitMargin: 0,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.id
    };

    try {
      console.log('💾 Salvando job:', newJob);
      
      // Adicionar ao estado local usando o método do contexto
      await addJob(newJob);
      
      // Forçar atualização da lista de jobs
      await refreshJobs();

      toast({
        title: "Job Salvo com Sucesso!",
        description: `Orçamento de "${formData.description}" foi salvo e vinculado ao cliente ${selectedClient.name}.`,
      });

      // Reset form após salvar com sucesso
      setFormData({
        description: '',
        eventDate: '',
        estimatedHours: 0,
        difficultyLevel: 'médio',
        logisticsValue: 0,
        equipmentValue: 0,
        assistanceValue: 0,
        category: '',
        discountPercentage: 0
      });
      
      setSelectedClient(null);
      
      setCalculatedPrice({
        totalCosts: 0,
        serviceValue: 0,
        valueWithDiscount: 0,
        hourlyRate: 0,
        additionalCosts: 0
      });

      console.log('✅ Job salvo e form resetado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao salvar job:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Ocorreu um erro ao salvar o job. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Calculator className={`text-${currentTheme.accent}`} />
          Calculadora Inteligente
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Calcule automaticamente baseado em seus custos e rotina</p>
        
        {/* NOVO: Botão para valores manuais */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => setShowManualValue(true)}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Valor Manual
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Job *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o projeto..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <ClientSelector 
              selectedClient={selectedClient}
              onClientSelect={setSelectedClient}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Data do Evento</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas *</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  inputMode="numeric"
                  placeholder="8"
                  value={formData.estimatedHours || ''}
                  onChange={(e) => setFormData({...formData, estimatedHours: Number(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                <Select value={formData.difficultyLevel} onValueChange={(value: any) => setFormData({...formData, difficultyLevel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fácil">Fácil</SelectItem>
                    <SelectItem value="médio">Médio</SelectItem>
                    <SelectItem value="complicado">Complicado (+50%)</SelectItem>
                    <SelectItem value="difícil">Difícil (+100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Desconto (%)</Label>
                  <PercentageInput
                    id="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={(value) => setFormData({...formData, discountPercentage: value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logisticsValue">Logística (R$)</Label>
                <CurrencyInput
                  id="logisticsValue"
                  value={formData.logisticsValue}
                  onChange={(value) => setFormData({...formData, logisticsValue: value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentValue">Equipamentos (R$)</Label>
                <CurrencyInput
                  id="equipmentValue"
                  value={formData.equipmentValue}
                  onChange={(value) => setFormData({...formData, equipmentValue: value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistanceValue">Assistência (R$)</Label>
                <CurrencyInput
                  id="assistanceValue"
                  value={formData.assistanceValue}
                  onChange={(value) => setFormData({...formData, assistanceValue: value})}
                />
              </div>
            </div>

            <Button onClick={calculatePrice} className={`w-full bg-gradient-to-r ${currentTheme.primary} hover:opacity-90`}>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Preço
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className={`bg-gradient-to-br ${currentTheme.secondary} border-${currentTheme.accent}/20`}>
          <CardHeader>
            <CardTitle className={`text-center text-${currentTheme.accent}`}>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {calculatedPrice.totalCosts > 0 ? (
              <>
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Valor Total</h3>
                    <div className={`text-2xl font-bold text-${currentTheme.accent}`}>
                      {formatCurrency(calculatedPrice.totalCosts)}
                    </div>
                  </div>
                  
                  {formData.discountPercentage > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">Valor com Desconto</h3>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(calculatedPrice.valueWithDiscount)}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Valor/Hora Base:</span>
                      <span className="font-semibold">{formatCurrency(calculatedPrice.hourlyRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Serviço ({formData.estimatedHours}h):</span>
                      <span>{formatCurrency(calculatedPrice.serviceValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custos Adicionais:</span>
                      <span>{formatCurrency(calculatedPrice.additionalCosts)}</span>
                    </div>
                    {formData.discountPercentage > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto ({formData.discountPercentage}%):</span>
                        <span>-{formatCurrency((calculatedPrice.totalCosts * formData.discountPercentage) / 100)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={saveJob} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Job'}
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <DollarSign className={`mx-auto h-12 w-12 text-${currentTheme.accent}`} />
                <h3 className={`text-2xl font-bold text-${currentTheme.accent}`}>Calculadora</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure sua rotina de trabalho para usar a calculadora.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NOVO: Modal para valores manuais */}
      <ManualValueModal 
        open={showManualValue} 
        onOpenChange={setShowManualValue}
      />
    </div>
  );
};

export default PricingCalculator;
