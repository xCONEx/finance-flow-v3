
import React, { useState, useEffect } from 'react';
import { Calculator, Save, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentageInput } from '@/components/ui/percentage-input';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, calculateDepreciation, getDifficultyMultiplier } from '../utils/formatters';

const PricingCalculator = () => {
  const { addJob, workRoutine, monthlyCosts, workItems } = useAppContext();
  const { currentTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: 0,
    difficultyLevel: 'médio' as 'fácil' | 'médio' | 'difícil' | 'muito difícil',
    logistics: '',
    logisticsValue: 0,
    equipment: '',
    equipmentValue: 0,
    assistance: '',
    assistanceValue: 0,
    category: '',
    discountPercentage: 0
  });

  const [calculatedPrice, setCalculatedPrice] = useState({
    totalCosts: 0,
    serviceValue: 0,
    valueWithDiscount: 0,
    hourlyRate: 0,
    baseHourlyRate: 0,
    monthlyCostsPortion: 0,
    depreciationCosts: 0,
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

    // Calcular valor base por hora da rotina
    const baseHourlyRate = workRoutine.valuePerHour;

    // Calcular custos mensais proporcionais às horas
    const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
    const monthlyCostsPortion = (totalMonthlyCosts / (workRoutine.workDaysPerMonth * workRoutine.workHoursPerDay)) * formData.estimatedHours;

    // Calcular depreciação de equipamentos
    const totalDepreciation = workItems.reduce((sum, item) => {
      return sum + calculateDepreciation(item.value, item.depreciationYears);
    }, 0) * formData.estimatedHours;

    // Custos adicionais do projeto
    const additionalCosts = formData.logisticsValue + formData.equipmentValue + formData.assistanceValue;

    // Aplicar multiplicador de dificuldade
    const difficultyMultiplier = getDifficultyMultiplier(formData.difficultyLevel);
    const adjustedHourlyRate = baseHourlyRate * difficultyMultiplier;

    // Calcular valor total do serviço
    const serviceValue = adjustedHourlyRate * formData.estimatedHours;
    
    // Somar todos os custos
    const totalCosts = serviceValue + monthlyCostsPortion + totalDepreciation + additionalCosts;

    // Aplicar desconto
    const discountAmount = (totalCosts * formData.discountPercentage) / 100;
    const valueWithDiscount = totalCosts - discountAmount;
    
    setCalculatedPrice({
      totalCosts,
      serviceValue,
      valueWithDiscount,
      hourlyRate: adjustedHourlyRate,
      baseHourlyRate,
      monthlyCostsPortion,
      depreciationCosts: totalDepreciation,
      additionalCosts
    });

    toast({
      title: "Preço Calculado!",
      description: "O orçamento foi calculado com base nos seus dados.",
    });
  };

  const saveJob = () => {
    if (!formData.description || !formData.client || calculatedPrice.totalCosts === 0) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios e calcule o preço primeiro.",
        variant: "destructive"
      });
      return;
    }

    addJob({
      description: formData.description,
      client: formData.client,
      eventDate: formData.eventDate,
      estimatedHours: formData.estimatedHours,
      difficultyLevel: formData.difficultyLevel,
      logistics: formData.logistics,
      equipment: formData.equipment,
      assistance: formData.assistance,
      status: 'pendente',
      category: formData.category,
      discountValue: (calculatedPrice.totalCosts * formData.discountPercentage) / 100,
      totalCosts: calculatedPrice.totalCosts,
      serviceValue: calculatedPrice.serviceValue,
      valueWithDiscount: calculatedPrice.valueWithDiscount,
      profitMargin: ((calculatedPrice.valueWithDiscount - calculatedPrice.totalCosts) / calculatedPrice.totalCosts) * 100
    });

    toast({
      title: "Job Salvo!",
      description: `Orçamento de ${formData.description} salvo com sucesso.`,
    });

    // Reset form
    setFormData({
      description: '',
      client: '',
      eventDate: '',
      estimatedHours: 0,
      difficultyLevel: 'médio',
      logistics: '',
      logisticsValue: 0,
      equipment: '',
      equipmentValue: 0,
      assistance: '',
      assistanceValue: 0,
      category: '',
      discountPercentage: 0
    });
    setCalculatedPrice({
      totalCosts: 0,
      serviceValue: 0,
      valueWithDiscount: 0,
      hourlyRate: 0,
      baseHourlyRate: 0,
      monthlyCostsPortion: 0,
      depreciationCosts: 0,
      additionalCosts: 0
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Calculator className={`text-${currentTheme.accent}`} />
          Calculadora Inteligente
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Calcule automaticamente baseado em seus custos e rotina</p>
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

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Input
                  id="client"
                  placeholder="Nome do cliente"
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                />
              </div>

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
                    <SelectItem value="difícil">Difícil</SelectItem>
                    <SelectItem value="muito difícil">Muito Difícil</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Desconto (%)</Label>
                <PercentageInput
                  id="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={(value) => setFormData({...formData, discountPercentage: value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logistics">Logística</Label>
                <Textarea
                  id="logistics"
                  placeholder="Detalhes da logística..."
                  value={formData.logistics}
                  onChange={(e) => setFormData({...formData, logistics: e.target.value})}
                />
                <div className="space-y-2">
                  <Label htmlFor="logisticsValue">Valor da Logística</Label>
                  <CurrencyInput
                    id="logisticsValue"
                    value={formData.logisticsValue}
                    onChange={(value) => setFormData({...formData, logisticsValue: value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipamentos</Label>
                <Textarea
                  id="equipment"
                  placeholder="Equipamentos necessários..."
                  value={formData.equipment}
                  onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                />
                <div className="space-y-2">
                  <Label htmlFor="equipmentValue">Valor dos Equipamentos</Label>
                  <CurrencyInput
                    id="equipmentValue"
                    value={formData.equipmentValue}
                    onChange={(value) => setFormData({...formData, equipmentValue: value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistance">Assistência</Label>
                <Textarea
                  id="assistance"
                  placeholder="Detalhes da assistência..."
                  value={formData.assistance}
                  onChange={(e) => setFormData({...formData, assistance: e.target.value})}
                />
                <div className="space-y-2">
                  <Label htmlFor="assistanceValue">Valor da Assistência</Label>
                  <CurrencyInput
                    id="assistanceValue"
                    value={formData.assistanceValue}
                    onChange={(value) => setFormData({...formData, assistanceValue: value})}
                  />
                </div>
              </div>
            </div>

            <Button onClick={calculatePrice} className={`w-full bg-gradient-to-r ${currentTheme.primary} hover:opacity-90`}>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Preço Inteligente
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
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Valor Final</h3>
                    <div className={`text-2xl font-bold text-${currentTheme.accent}`}>
                      {formatCurrency(calculatedPrice.valueWithDiscount)}
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Valor/Hora:</span>
                      <span className="font-semibold">{formatCurrency(calculatedPrice.hourlyRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Serviço:</span>
                      <span>{formatCurrency(calculatedPrice.serviceValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custos Mensais:</span>
                      <span>{formatCurrency(calculatedPrice.monthlyCostsPortion)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depreciação:</span>
                      <span>{formatCurrency(calculatedPrice.depreciationCosts)}</span>
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

                <Button onClick={saveJob} className="w-full bg-green-600 hover:bg-green-700">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Job
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <DollarSign className={`mx-auto h-12 w-12 text-${currentTheme.accent}`} />
                <h3 className={`text-2xl font-bold text-${currentTheme.accent}`}>Calculadora Inteligente</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure sua rotina de trabalho e adicione itens/custos para usar a calculadora inteligente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingCalculator;
