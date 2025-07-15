import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, X, Crown, Building } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useSubscriptionPermissions } from '../hooks/useSubscriptionPermissions';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { caktoPaymentLinks } from '@/config/caktoPaymentLinks';

const CustomLogoManager = () => {
  const { user, profile, updateProfile } = useSupabaseAuth();
  const { limits } = useSubscriptionPermissions();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const canUseCustomLogo = limits.canUseCustomLogo;

  const handleLogoClick = () => {
    if (!canUseCustomLogo) {
      toast({
        title: "Funcionalidade Premium",
        description: "A logo personalizada está disponível apenas nos planos Premium e Enterprise.",
        variant: "destructive"
      });
      return;
    }
    logoInputRef.current?.click();
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A logo deve ter no máximo 2MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const { error } = await supabase
          .from('profiles')
          .update({ logo_base64: base64, updated_at: new Date().toISOString() })
          .eq('id', user?.id);

        if (error) {
          toast({
            title: "Erro",
            description: "Erro ao atualizar logo da empresa",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Logo da empresa atualizada!"
          });
          window.location.reload();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeLogo = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ logo_base64: null, updated_at: new Date().toISOString() })
        .eq('id', user?.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao remover logo",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Logo removida com sucesso!"
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = () => {
    if (profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual') {
      return <Building className="h-4 w-4" />;
    }
    return <Crown className="h-4 w-4" />;
  };

  const getPlanName = () => {
    if (profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual') {
      return 'Enterprise';
    }
    return 'Premium';
  };

  if (!canUseCustomLogo) {
    return (
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-500">
            <Crown className="h-5 w-5" />
            Logo Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Crown className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Funcionalidade Premium
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Adicione sua logo personalizada nos PDFs de orçamento
            </p>
            <Badge variant="outline" className="mb-4">
              Disponível no Premium e Enterprise
            </Badge>
          </div>
          <Button 
            onClick={() => window.open(caktoPaymentLinks.premium, '_blank')}
            className="w-full"
          >
            Fazer Upgrade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Logo Personalizada
          <Badge variant="outline" className="ml-2">
            {getPlanName()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Sua logo aparecerá nos PDFs de orçamento e relatórios</p>
        </div>

        <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          {profile?.logo_base64 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={profile.logo_base64} 
                  alt="Logo da empresa" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Logo atual</span>
                  <p className="text-xs text-gray-500">Aparece nos PDFs</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogoClick}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Alterar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLogoClick}
                disabled={loading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Carregando...' : 'Upload da Logo'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG ou JPEG (máx. 2MB)
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            {getPlanIcon()}
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Benefícios da Logo Personalizada
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                <li>• Aparece nos PDFs de orçamento</li>
                <li>• Profissionaliza seus documentos</li>
                <li>• Reforça sua marca</li>
                <li>• Disponível no plano {getPlanName()}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomLogoManager; 
