
import React, { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './ForgotPasswordModal';
import { Capacitor } from '@capacitor/core';

const LoginPage = () => {
  const { signIn, signUp, signInWithGoogle, signInWithBiometric, isAuthenticated } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Verificar se biometria está disponível
  useEffect(() => {
    const checkBiometric = async () => {
      // Verificar se há credenciais salvas
      const hasSavedCredentials = localStorage.getItem('saved_email') && localStorage.getItem('saved_password');
      
      if (Capacitor.isNativePlatform()) {
        // Para plataformas móveis nativas
        setBiometricAvailable(hasSavedCredentials);
      } else {
        // Para web/PWA, verificar se WebAuthn está disponível
        const webAuthnAvailable = 'credentials' in navigator && 'create' in navigator.credentials;
        setBiometricAvailable(webAuthnAvailable && hasSavedCredentials);
      }
    };
    checkBiometric();
  }, []);

  // Carregar email salvo se existir
  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password, rememberMe);
        if (error) throw error;
        
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao FinanceFlow",
        });
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) throw error;
        
        toast({
          title: "Conta criada!",
          description: "Bem-vindo ao FinanceFlow",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer login/cadastro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      
      toast({
        title: "Login realizado!",
        description: "Conectado com sucesso",
      });
    } catch (error: any) {
      console.error('❌ Erro no login com Google:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer login com Google",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithBiometric();
      if (error) throw error;
      
      toast({
        title: "Login realizado!",
        description: "Autenticado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro na autenticação biométrica",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-40 right-32 w-24 h-24 bg-white rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full blur-md"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white">
          {/* Badge */}
          <div className="mb-8">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              Para Videomakers & Agências Criativas
            </span>
          </div>

          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold leading-tight mb-4">
              Gestão financeira{' '}
              <span className="bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
                simples e inteligente
              </span>
            </h1>
            <p className="text-xl text-purple-100 leading-relaxed">
              Precifique projetos com precisão, controle custos e maximize seus lucros com o FinanceFlow.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-purple-100">Dados seguros</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-purple-100">Setup em 2 minutos</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-purple-100">4.9/5 avaliação</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => window.open('https://lpfinanceflow.vercel.app', '_blank')}
            >
              Ver planos →
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen lg:min-h-auto">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${currentTheme.primary} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg`}>
              <span className="text-white font-bold text-lg sm:text-2xl">FF</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}>
              FinanceFlow
            </h1>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6 pb-4 sm:pb-8">
              {/* Desktop Logo */}
              <div className="hidden lg:block">
                <div className={`w-16 h-16 bg-gradient-to-r ${currentTheme.primary} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-white font-bold text-2xl">FF</span>
                </div>
                <CardTitle className={`text-3xl font-bold bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}>
                  FinanceFlow
                </CardTitle>
              </div>
              
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {isLogin ? 'Entre na sua conta para continuar' : 'Comece gratuitamente hoje'}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              {/* Face ID Button (apenas quando disponível) */}
              {biometricAvailable && isLogin && (
                <Button
                  onClick={handleBiometricLogin}
                  className={`w-full h-10 sm:h-12 bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base mb-4`}
                  disabled={loading}
                >
                  <Fingerprint className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {loading ? 'Autenticando...' : 'Entrar com Face ID'}
                </Button>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-10 sm:h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-xl"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="h-10 sm:h-12 pl-10 sm:pl-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-xl"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-10 sm:h-12 pl-10 sm:pl-12 pr-10 sm:pr-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-xl"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                </div>

                {/* Checkbox Lembrar-me e Link Esqueceu senha */}
                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                      <Label
                        htmlFor="remember"
                        className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                      >
                        Lembrar-me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs sm:text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 p-0 h-auto"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Esqueceu sua senha?
                    </Button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className={`w-full h-10 sm:h-12 bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base`}
                  disabled={loading}
                >
                  <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                </Button>
              </form>

              <div className="relative">
                <Separator className="my-4 sm:my-6" />
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-3 sm:px-4 text-xs sm:text-sm text-gray-500">
                  ou
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full h-10 sm:h-12 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium text-sm sm:text-base"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Conectando...' : 'Continuar com Google'}
              </Button>

              {/* Mobile Ver Planos Button */}
              <div className="lg:hidden pt-2">
                <Button
                  variant="outline"
                  className="w-full h-10 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-xl font-medium text-sm"
                  onClick={() => window.open('https://lpfinanceflow.vercel.app', '_blank')}
                >
                  Ver planos →
                </Button>
              </div>

              <div className="text-center pt-2 sm:pt-4">
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se gratuitamente' : 'Já tem conta? Entre aqui'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de recuperação de senha */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default LoginPage;
