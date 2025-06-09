import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Calendar, Clock, Truck, Camera, Users, Save, FileText, Trash2 } from 'lucide-react';
import { generateJobPDF } from '../utils/pdfGenerator';

const PricingCalculator = () => {
  const { workRoutine, monthlyCosts, workItems, jobs, addJob, setJobs } = useAppContext();
  const { user, userData } = useAuth();
  const { formatValue } = usePrivacy();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: 8,
    difficultyLevel: 'médio',
    logistics: 0,
    equipment: 0,
    assistance: 0
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1);
  const [totalCosts, setTotalCosts] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Calculate difficulty multiplier based on selected level
  useEffect(() => {
    switch (formData.difficultyLevel) {
      case 'fácil':
        setDifficultyMultiplier(0.8);
        break;
      case 'médio':
        setDifficultyMultiplier(1);
        break;
      case 'complicado':
        setDifficultyMultiplier(1.3);
        break;
      case 'difícil':
        setDifficultyMultiplier(1.5);
        break;
      default:
        setDifficultyMultiplier(1);
    }
  }, [formData.difficultyLevel]);

  // Calculate total costs and value
  useEffect(() => {
    const hourlyRate = workRoutine?.valuePerHour || 0;
    const baseValue = hourlyRate * formData.estimatedHours * difficultyMultiplier;
    
    // Calculate additional costs
    const logisticsCost = formData.logistics;
    const equipmentCost = formData.equipment;
    const assistanceCost = formData.assistance;
    
    const totalAdditionalCosts = logisticsCost + equipmentCost + assistanceCost;
    setTotalCosts(totalAdditionalCosts);
    
    // Calculate total value
    const calculatedTotal = baseValue + totalAdditionalCosts;
    setTotalValue(calculatedTotal);
  }, [formData, difficultyMultiplier, workRoutine]);

  const handleSaveJob = async () => {
    if (!formData.description || !formData.client) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (descrição e cliente).",
        variant: "destructive"
      });
      return;
    }

    try {
      await addJob({
        title: formData.description, // Add missing title property
        value: totalValue, // Add missing value property
        description: formData.description,
        client: formData.client,
        eventDate: formData.eventDate,
        estimatedHours: formData.estimatedHours,
        difficultyLevel: formData.difficultyLevel,
        logistics: formData.logistics,
        equipment: formData.equipment,
        assistance: formData.assistance,
        status: 'pendente',
        category: 'Calculado',
        totalCosts,
        serviceValue: totalValue,
        valueWithDiscount: totalValue,
        profitMargin: ((totalValue - totalCosts) / totalValue) * 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || ''
      });

      const jobsArray = Array.isArray(jobs) ? jobs : [];
      setJobs([...jobsArray, {
        id: Date.now().toString(),
        title: formData.description,
        value: totalValue,
        description: formData.description,
        client: formData.client,
        eventDate: formData.eventDate,
        estimatedHours: formData.estimatedHours,
        difficultyLevel: formData.difficultyLevel,
        logistics: formData.logistics,
        equipment: formData.equipment,
        assistance: formData.assistance,
        status: 'pendente',
        category: 'Calculado',
        totalCosts,
        serviceValue: totalValue,
        valueWithDiscount: totalValue,
        profitMargin: ((totalValue - totalCosts) / totalValue) * 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || ''
      }]);

      toast({
        title: "Job Salvo!",
        description: "O cálculo foi salvo com sucesso.",
      });

      // Reset form
      setFormData({
        description: '',
        client: '',
        eventDate: '',
        estimatedHours: 8,
        difficultyLevel: 'médio',
        logistics: 0,
        equipment: 0,
        assistance: 0
      });
    } catch (error) {
      console.error('Erro ao salvar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o job.",
        variant: "destructive"
      });
    }
  };

  const handleGeneratePDF = () => {
    const jobData = {
      id: 'temp-' + Date.now(),
      title: formData.description || 'Orçamento',
      description: formData.description,
      client: formData.client,
      eventDate: formData.eventDate,
      estimatedHours: formData.estimatedHours,
      difficultyLevel: formData.difficultyLevel,
      logistics: formData.logistics,
      equipment: formData.equipment,
      assistance: formData.assistance,
      totalCosts,
      serviceValue: totalValue,
      valueWithDiscount: totalValue,
      profitMargin: ((totalValue - totalCosts) / totalValue) * 100,
      createdAt: new Date().toISOString()
    };

    generateJobPDF(jobData, userData);
  };

  // Monthly costs summary
  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
  const dailyCost = totalMonthlyCosts / (workRoutine?.workDaysPerMonth || 22);
  const hourlyCost = dailyCost / (workRoutine?.workHoursPerDay || 8);

  // Equipment value summary
  const totalEquipmentValue = workItems.reduce((sum, item) => sum + item.value, 0);
  const monthlyDepreciation = workItems.reduce((sum, item) => 
    sum + (item.value / (item.depreciationYears * 12)), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calculadora de Preços</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Calcule o valor ideal para seus serviços
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGeneratePDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleSaveJob}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Detalhes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Serviço *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Ex: Ensaio fotográfico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Data do Evento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="eventDate"
                      type="date"
                      className="pl-10"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="estimatedHours"
                      type="number"
                      className="pl-10"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({...formData, estimatedHours: parseInt(e.target.value) || 0})}
                      min="1"
                      max="24"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficultyLevel">Nível de Dificuldade</Label>
                <Select 
                  value={formData.difficultyLevel} 
                  onValueChange={(value) => setFormData({...formData, difficultyLevel: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível de dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fácil">Fácil (80%)</SelectItem>
                    <SelectItem value="médio">Médio (100%)</SelectItem>
                    <SelectItem value="complicado">Complicado (130%)</SelectItem>
                    <SelectItem value="difícil">Difícil (150%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="advanced-mode"
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <Label htmlFor="advanced-mode">Mostrar opções avançadas</Label>
              </div>

              {showAdvanced && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="space-y-4">
                    <Label className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Logística e Deslocamento
                      </span>
                      <span>{formatValue(formData.logistics)}</span>
                    </Label>
                    <CurrencyInput
                      value={formData.logistics}
                      onChange={(value) => setFormData({...formData, logistics: value})}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Aluguel de Equipamentos
                      </span>
                      <span>{formatValue(formData.equipment)}</span>
                    </Label>
                    <CurrencyInput
                      value={formData.equipment}
                      onChange={(value) => setFormData({...formData, equipment: value})}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Assistentes
                      </span>
                      <span>{formatValue(formData.assistance)}</span>
                    </Label>
                    <CurrencyInput
                      value={formData.assistance}
                      onChange={(value) => setFormData({...formData, assistance: value})}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-4xl font-bold">{formatValue(totalValue)}</p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Valor por hora:</span>
                  <span className="font-medium">{formatValue(workRoutine?.valuePerHour || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Horas estimadas:</span>
                  <span className="font-medium">{formData.estimatedHours}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Multiplicador de dificuldade:</span>
                  <span className="font-medium">{difficultyMultiplier}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valor base:</span>
                  <span className="font-medium">
                    {formatValue((workRoutine?.valuePerHour || 0) * formData.estimatedHours * difficultyMultiplier)}
                  </span>
                </div>
              </div>

              {showAdvanced && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Logística:</span>
                    <span className="font-medium">{formatValue(formData.logistics)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Equipamentos:</span>
                    <span className="font-medium">{formatValue(formData.equipment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Assistentes:</span>
                    <span className="font-medium">{formatValue(formData.assistance)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2">
                    <span>Custos adicionais:</span>
                    <span>{formatValue(totalCosts)}</span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={handleSaveJob} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Job
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seus Custos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Custos mensais:</span>
                  <span className="font-medium">{formatValue(totalMonthlyCosts)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo diário:</span>
                  <span className="font-medium">{formatValue(dailyCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo por hora:</span>
                  <span className="font-medium">{formatValue(hourlyCost)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Valor equipamentos:</span>
                  <span className="font-medium">{formatValue(totalEquipmentValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Depreciação mensal:</span>
                  <span className="font-medium">{formatValue(monthlyDepreciation)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;
