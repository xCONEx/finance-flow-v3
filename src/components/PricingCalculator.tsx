
import React, { useState, useEffect } from 'react';
import { Calculator, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useApp } from '../contexts/AppContext';

interface JobData {
  description: string;
  client: string;
  eventDate: string;
  estimatedHours: number;
  difficultyLevel: 'fácil' | 'médio' | 'complicado' | 'difícil';
  category: string;
  discount: number;
  logistics: number;
  equipment: number;
  assistance: number;
}

const PricingCalculator: React.FC = () => {
  const { addJob, workRoutine } = useApp();
  const [showManualModal, setShowManualModal] = useState(false);
  const [jobData, setJobData] = useState<JobData>({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: 8,
    difficultyLevel: 'médio',
    category: '',
    discount: 0,
    logistics: 0,
    equipment: 0,
    assistance: 0
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const categories = [
    'Casamento',
    'Evento Corporativo', 
    'Comercial',
    'Documentário',
    'Social Media',
    'Outro'
  ];

  const difficultyMultipliers = {
    'fácil': 0.8,
    'médio': 1.0,
    'complicado': 1.3,
    'difícil': 1.6
  };

  useEffect(() => {
    if (workRoutine && jobData.estimatedHours > 0) {
      calculatePrice();
    }
  }, [jobData, workRoutine]);

  const calculatePrice = () => {
    if (!workRoutine) {
      setShowResult(false);
      return;
    }

    const baseValue = jobData.estimatedHours * workRoutine.valuePerHour;
    const difficultyMultiplier = difficultyMultipliers[jobData.difficultyLevel];
    const adjustedValue = baseValue * difficultyMultiplier;
    
    const totalCosts = jobData.logistics + jobData.equipment + jobData.assistance;
    const serviceValue = adjustedValue + totalCosts;
    
    const discountAmount = (serviceValue * jobData.discount) / 100;
    const finalPrice = serviceValue - discountAmount;
    
    setCalculatedPrice(finalPrice);
    setShowResult(true);
  };

  const handleCalculatePrice = () => {
    if (!jobData.description || !jobData.client) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos a descrição e o cliente",
        variant: "destructive"
      });
      return;
    }

    if (!workRoutine) {
      toast({
        title: "Configuração Necessária",
        description: "Configure sua rotina de trabalho para usar a calculadora",
        variant: "destructive"
      });
      return;
    }

    calculatePrice();

    // Salvar o job
    const jobToSave = {
      description: jobData.description,
      client: jobData.client,
      eventDate: jobData.eventDate,
      estimatedHours: jobData.estimatedHours,
      difficultyLevel: jobData.difficultyLevel,
      logistics: jobData.logistics,
      equipment: jobData.equipment,
      assistance: jobData.assistance,
      status: 'pendente' as const,
      category: jobData.category,
      discountValue: jobData.discount,
      totalCosts: jobData.logistics + jobData.equipment + jobData.assistance,
      serviceValue: calculatedPrice,
      valueWithDiscount: calculatedPrice,
      profitMargin: 30
    };

    addJob(jobToSave);

    toast({
      title: "Orçamento Calculado",
      description: `Orçamento de R$ ${calculatedPrice.toFixed(2)} foi salvo.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleInputChange = (field: keyof JobData, value: string | number) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calculator className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Calculadora Inteligente</h1>
        </div>
        <p className="text-gray-600">Calcule automaticamente baseado em seus custos e rotina</p>
        
        <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Valor Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Valor Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input placeholder="Ex: Custo adicional especial" />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" placeholder="0,00" />
              </div>
              <Button className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dados do Projeto */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="description">Descrição do Job *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o projeto..."
                  value={jobData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Cliente *</Label>
                  <Input
                    id="client"
                    placeholder="Nome do cliente"
                    value={jobData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDate">Data do Evento</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={jobData.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours">Horas Estimadas *</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={jobData.estimatedHours}
                    onChange={(e) => handleInputChange('estimatedHours', Number(e.target.value))}
                    className="mt-1"
                    min="1"
                    step="0.5"
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                  <Select
                    value={jobData.difficultyLevel}
                    onValueChange={(value: 'fácil' | 'médio' | 'complicado' | 'difícil') => 
                      handleInputChange('difficultyLevel', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fácil">Fácil</SelectItem>
                      <SelectItem value="médio">Médio</SelectItem>
                      <SelectItem value="complicado">Complicado</SelectItem>
                      <SelectItem value="difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={jobData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="discount"
                      type="number"
                      value={jobData.discount}
                      onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="logistics">Logística (R$)</Label>
                  <Input
                    id="logistics"
                    type="number"
                    placeholder="0,00"
                    value={jobData.logistics}
                    onChange={(e) => handleInputChange('logistics', Number(e.target.value))}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="equipment">Equipamentos (R$)</Label>
                  <Input
                    id="equipment"
                    type="number"
                    placeholder="0,00"
                    value={jobData.equipment}
                    onChange={(e) => handleInputChange('equipment', Number(e.target.value))}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="assistance">Assistência (R$)</Label>
                  <Input
                    id="assistance"
                    type="number"
                    placeholder="0,00"
                    value={jobData.assistance}
                    onChange={(e) => handleInputChange('assistance', Number(e.target.value))}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCalculatePrice} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                size="lg"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calcular Preço
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardHeader className="text-center">
              <CardTitle className="text-purple-800">Resultado</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {!workRoutine ? (
                <div className="py-8">
                  <div className="text-6xl mb-4">$</div>
                  <h3 className="text-xl font-bold text-purple-800 mb-2">Calculadora</h3>
                  <p className="text-gray-600 text-sm">
                    Configure sua rotina de trabalho para usar a calculadora.
                  </p>
                </div>
              ) : !showResult ? (
                <div className="py-8">
                  <div className="text-6xl mb-4">$</div>
                  <h3 className="text-xl font-bold text-purple-800 mb-2">Calculadora</h3>
                  <p className="text-gray-600 text-sm">
                    Preencha os dados do projeto para ver o resultado.
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <div className="text-4xl font-bold text-purple-800 mb-4">
                    {formatCurrency(calculatedPrice)}
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horas:</span>
                      <span className="font-medium">{jobData.estimatedHours}h</span>
                    </div>
                    
                    {workRoutine && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor/hora:</span>
                        <span className="font-medium">{formatCurrency(workRoutine.valuePerHour)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dificuldade:</span>
                      <span className="font-medium capitalize">{jobData.difficultyLevel}</span>
                    </div>
                    
                    {(jobData.logistics + jobData.equipment + jobData.assistance) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Custos extras:</span>
                        <span className="font-medium">
                          {formatCurrency(jobData.logistics + jobData.equipment + jobData.assistance)}
                        </span>
                      </div>
                    )}
                    
                    {jobData.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto:</span>
                        <span className="font-medium">-{jobData.discount}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;
