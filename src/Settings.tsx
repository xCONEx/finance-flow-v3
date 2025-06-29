import React from 'react';
import { Settings as SettingsIcon, Palette, Database, Crown, Moon, Sun, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import NotificationSettings from './NotificationSettings';

const Settings = () => {
  const { isDark, currentTheme, toggleDarkMode, changeTheme } = useTheme();
  const { user, profile } = useSupabaseAuth();

  const themes = [
    { id: 'purple-blue', name: 'Roxo & Azul', colors: 'from-purple-600 to-blue-600' },
    { id: 'green-blue', name: 'Verde & Azul', colors: 'from-green-600 to-blue-600' },
    { id: 'orange-red', name: 'Laranja & Vermelho', colors: 'from-orange-600 to-red-600' }
  ];

  const isCompanyUser = profile?.user_type === 'company_owner' || profile?.user_type === 'employee';

  return (
    <div className="space-y-6 pb-20 md:pb-6 px-4 md:px-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Gerencie suas preferências e configurações da conta.
        </p>
      </div>

      <div className="grid gap-4 md:gap-6">
        <NotificationSettings />
        
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="about" className="flex flex-col items-center gap-1 p-2 text-xs">
              <BookOpen className="h-4 w-4" />
              <span>Sobre</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex flex-col items-center gap-1 p-2 text-xs">
              <Palette className="h-4 w-4" />
              <span>Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex flex-col items-center gap-1 p-2 text-xs">
              <Database className="h-4 w-4" />
              <span>Dados</span>
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex flex-col items-center gap-1 p-2 text-xs">
              <Crown className="h-4 w-4" />
              <span>Premium</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 md:space-y-6 mt-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  📘 Sobre o FinanceFlow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
                <div className="text-center space-y-4">
                  <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${currentTheme.primary} rounded-2xl flex items-center justify-center mx-auto`}>
                    <span className="text-white font-bold text-xl md:text-2xl">FF</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold">📱 FinanceFlow</h3>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                      Sistema de gestão e precificação para audiovisual
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm md:text-base">🛠️ Desenvolvedor</h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm md:text-base">Yuri Adriel</p>
                    </div>
                    
                    <div className="p-3 md:p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm md:text-base">🔢 Versão</h4>
                      <p className="text-green-700 dark:text-green-300 text-sm md:text-base">1.0.0</p>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="p-3 md:p-4 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-lg">
                      <h4 className="font-semibold text-pink-800 dark:text-pink-200 mb-2 text-sm md:text-base">📸 Instagram</h4>
                      <p className="text-pink-700 dark:text-pink-300 text-sm md:text-base">@euyuriadriel</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-xs md:text-sm"
                        onClick={() => window.open('https://instagram.com/euyuriadriel', '_blank')}
                      >
                        Visitar Perfil
                      </Button>
                    </div>
                    
                    <div className="p-3 md:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm md:text-base">🚀 Status</h4>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm md:text-base">Sistema em produção</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg text-center">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">💡 Sobre o Sistema</h4>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                    O FinanceFlow foi desenvolvido para profissionais do audiovisual que precisam de uma ferramenta 
                    completa para calcular custos, gerenciar projetos e organizar suas finanças de forma eficiente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 md:space-y-6 mt-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Personalização Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <Label className="text-sm md:text-base">Modo {isDark ? 'Escuro' : 'Claro'}</Label>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {isDark ? 'Tema escuro ativado' : 'Ative o tema escuro para reduzir o cansaço visual'}
                    </p>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm md:text-base">Tema de Cores</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          currentTheme.name === theme.name ? `border-${currentTheme.accent}` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => changeTheme(theme.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${theme.colors} rounded-lg`} />
                          <div className="flex-1">
                            <p className="text-sm md:text-base font-medium">{theme.name}</p>
                            {currentTheme.name === theme.name && (
                              <Badge className="mt-1">Ativo</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 md:space-y-6 mt-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Gerenciamento de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0">
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2">
                    <Database className="h-5 w-5 md:h-6 md:w-6" />
                    <span className="text-xs md:text-sm">Exportar JSON</span>
                  </Button>
                  <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2">
                    <Database className="h-5 w-5 md:h-6 md:w-6" />
                    <span className="text-xs md:text-sm">Exportar CSV</span>
                  </Button>
                  <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center space-y-2">
                    <Database className="h-5 w-5 md:h-6 md:w-6" />
                    <span className="text-xs md:text-sm">Importar Planilha</span>
                  </Button>
                </div>

                <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 text-sm md:text-base">Backup Automático</h4>
                  <p className="text-xs md:text-sm text-green-700 dark:text-green-300">
                    Seus dados são automaticamente salvos no navegador. 
                    Último backup: hoje às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="premium" className="space-y-4 md:space-y-6 mt-4">
            <Card className={`bg-gradient-to-br ${currentTheme.secondary} border-${currentTheme.accent}/20`}>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-${currentTheme.accent} text-lg md:text-xl`}>
                  <Crown className="h-5 w-5" />
                  FinanceFlow Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
                {!isCompanyUser && (
                  <div className="p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 text-sm md:text-base">Empresa - Apenas Plano Pago</h4>
                    <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">
                      Para acessar as funcionalidades de empresa (logo, equipe, projetos), 
                      entre em contato conosco para ativar o plano empresarial.
                    </p>
                    <Button 
                      className="mt-3 text-xs md:text-sm" 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://lpfinanceflow.vercel.app', '_blank')}
                    >
                      Entrar em Contato
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  <div className="space-y-3 md:space-y-4">
                    <h4 className={`font-semibold text-${currentTheme.accent} text-sm md:text-base`}>Recursos Premium:</h4>
                    <ul className="space-y-2 text-xs md:text-sm">
                      {[
                        'Relatórios avançados com gráficos',
                        'Geração de PDF com logo da empresa',
                        'Importação de planilhas',
                        'Gestão de equipe completa',
                        'Kanban de projetos',
                        'Backup automático em nuvem',
                        'Suporte prioritário',
                        'Templates personalizados'
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className={`w-2 h-2 bg-${currentTheme.accent} rounded-full`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-center space-y-3 md:space-y-4">
                    <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className={`text-2xl md:text-3xl font-bold text-${currentTheme.accent}`}>R$ 97</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">/mês</div>
                      <div className="text-xs text-gray-500 mt-1">ou R$ 970/ano (2 meses grátis)</div>
                    </div>
                    
                    <Button 
                      className={`w-full bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 text-xs md:text-sm`}
                      onClick={() => window.open('https://lpfinanceflow.vercel.app', '_blank')}
                    >
                      Entrar em Contato
                    </Button>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      14 dias grátis • Cancele quando quiser
                    </p>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm md:text-base">Status da Assinatura</p>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {isCompanyUser ? 'Plano Empresarial' : 'Plano Gratuito'}
                      </p>
                    </div>
                    <Badge variant={isCompanyUser ? "default" : "outline"}>
                      {isCompanyUser ? 'Premium' : 'Gratuito'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
