
import React, { useState } from 'react';
import { Settings as SettingsIcon, Building2, Palette, Database, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: 'Minha Produtora',
    type: 'Produtora Audiovisual',
    logo: ''
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <SettingsIcon className="text-purple-600" />
          Configurações
        </h2>
        <p className="text-gray-600">Personalize sua experiência no FinanceFlow</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Premium</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyType">Tipo de Negócio</Label>
                <Input
                  id="companyType"
                  value={companyData.type}
                  onChange={(e) => setCompanyData({...companyData, type: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {companyData.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <Button variant="outline">Alterar Logo</Button>
                </div>
              </div>

              <Button className="w-full">Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalização Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Modo Escuro</Label>
                  <p className="text-sm text-gray-600">Ative o tema escuro para reduzir o cansaço visual</p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              <div className="space-y-3">
                <Label>Tema de Cores</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Roxo & Azul', colors: 'from-purple-600 to-blue-600', active: true },
                    { name: 'Verde & Azul', colors: 'from-green-600 to-blue-600', active: false },
                    { name: 'Laranja & Vermelho', colors: 'from-orange-600 to-red-600', active: false }
                  ].map((theme, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        theme.active ? 'border-purple-600' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-8 bg-gradient-to-r ${theme.colors} rounded mb-2`} />
                      <p className="text-sm font-medium">{theme.name}</p>
                      {theme.active && <Badge className="mt-2">Ativo</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Database className="h-6 w-6" />
                  <span>Exportar JSON</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Database className="h-6 w-6" />
                  <span>Exportar CSV</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Database className="h-6 w-6" />
                  <span>Exportar PDF</span>
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Backup Automático</h4>
                <p className="text-sm text-yellow-700">
                  Seus dados são automaticamente salvos e sincronizados na nuvem. 
                  Último backup: hoje às 14:30
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premium" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Crown className="h-5 w-5" />
                FinanceFlow Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-800">Recursos Premium:</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Relatórios avançados com gráficos',
                      'Integrações com Stripe e PayPal',
                      'Backup automático em tempo real',
                      'Suporte prioritário via WhatsApp',
                      'Templates de contratos',
                      'Análise de rentabilidade por projeto',
                      'Equipe ilimitada',
                      'Notificações push'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-center space-y-4">
                  <div className="p-6 bg-white rounded-lg border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">R$ 47</div>
                    <div className="text-sm text-gray-600">/mês</div>
                    <div className="text-xs text-gray-500 mt-1">ou R$ 470/ano (2 meses grátis)</div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Assinar Premium
                  </Button>
                  
                  <p className="text-xs text-gray-600">
                    7 dias grátis • Cancele quando quiser
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Status da Assinatura</p>
                    <p className="text-sm text-gray-600">Plano Gratuito</p>
                  </div>
                  <Badge variant="outline">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
