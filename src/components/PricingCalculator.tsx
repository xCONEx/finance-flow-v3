
import React, { useState } from 'react';
import { Calculator, Save, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const PricingCalculator = () => {
  const [formData, setFormData] = useState({
    jobType: '',
    hourlyRate: '',
    workDays: '',
    teamSize: '',
    equipment: '',
    software: '',
    profitMargin: '30',
    additionalCosts: ''
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const jobTypes = [
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
    const hourlyRate = parseFloat(formData.hourlyRate) || 0;
    const workDays = parseFloat(formData.workDays) || 0;
    const teamSize = parseFloat(formData.teamSize) || 1;
    const equipment = parseFloat(formData.equipment) || 0;
    const software = parseFloat(formData.software) || 0;
    const profitMargin = parseFloat(formData.profitMargin) || 0;
    const additionalCosts = parseFloat(formData.additionalCosts) || 0;

    const baseCost = (hourlyRate * workDays * 8 * teamSize) + equipment + software + additionalCosts;
    const finalPrice = baseCost * (1 + profitMargin / 100);
    
    setCalculatedPrice(finalPrice);
  };

  const saveJob = () => {
    if (!formData.jobType || calculatedPrice === 0) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios e calcule o preço primeiro.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Job Salvo!",
      description: `Orçamento de ${formData.jobType} salvo com sucesso.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Calculator className="text-purple-600" />
          Calculadora de Precificação
        </h2>
        <p className="text-gray-600">Calcule o valor ideal para seus projetos audiovisuais</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobType">Tipo de Job *</Label>
                <Select value={formData.jobType} onValueChange={(value) => setFormData({...formData, jobType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Valor por Hora (R$) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="150"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workDays">Número de Diárias *</Label>
                <Input
                  id="workDays"
                  type="number"
                  placeholder="2"
                  value={formData.workDays}
                  onChange={(e) => setFormData({...formData, workDays: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Tamanho da Equipe</Label>
                <Input
                  id="teamSize"
                  type="number"
                  placeholder="3"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Custo de Equipamentos (R$)</Label>
                <Input
                  id="equipment"
                  type="number"
                  placeholder="500"
                  value={formData.equipment}
                  onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="software">Custo de Software (R$)</Label>
                <Input
                  id="software"
                  type="number"
                  placeholder="200"
                  value={formData.software}
                  onChange={(e) => setFormData({...formData, software: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  placeholder="30"
                  value={formData.profitMargin}
                  onChange={(e) => setFormData({...formData, profitMargin: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalCosts">Custos Adicionais (R$)</Label>
                <Input
                  id="additionalCosts"
                  type="number"
                  placeholder="300"
                  value={formData.additionalCosts}
                  onChange={(e) => setFormData({...formData, additionalCosts: e.target.value})}
                />
              </div>
            </div>

            <Button onClick={calculatePrice} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Preço
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-center text-purple-800">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <DollarSign className="mx-auto h-12 w-12 text-purple-600" />
              <h3 className="text-2xl font-bold text-purple-800">Valor Sugerido</h3>
              <div className="text-4xl font-bold text-purple-600">
                R$ {calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {calculatedPrice > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Breakdown:</p>
                  <div className="text-left space-y-1 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>Custo Base:</span>
                      <span>R$ {(calculatedPrice / (1 + parseFloat(formData.profitMargin || '0') / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem ({formData.profitMargin}%):</span>
                      <span>R$ {(calculatedPrice - (calculatedPrice / (1 + parseFloat(formData.profitMargin || '0') / 100))).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={saveJob} className="w-full bg-green-600 hover:bg-green-700">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Orçamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingCalculator;
