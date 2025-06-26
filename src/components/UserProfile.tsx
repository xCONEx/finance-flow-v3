
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, User, Building2, Crown } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useAgency } from '../contexts/AgencyContext';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, profile, updateProfile } = useSupabaseAuth();
  const { agencies, currentContext } = useAgency();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    company: profile?.company || ''
  });
  const [loading, setLoading] = useState(false);

  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';

  // Buscar nome da agência do usuário (se pertence a alguma)
  const userAgency = agencies.find(agency => 
    (currentContext !== 'individual' && currentContext.id === agency.id) ||
    (profile?.agency_id && agency.id === profile.agency_id)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB",
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
          .update({ image_user: base64, updated_at: new Date().toISOString() })
          .eq('id', user?.id);

        if (error) {
          toast({
            title: "Erro",
            description: "Erro ao atualizar foto de perfil",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Foto de perfil atualizada!"
          });
          window.location.reload();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar imagem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      await updateProfile();
      
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    switch (subscription) {
      case 'enterprise':
      case 'enterprise-annual':
        return 'bg-purple-100 text-purple-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meu Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Foto e informações básicas */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 mx-auto cursor-pointer" onClick={handleImageClick}>
                  <AvatarImage src={profile?.image_user || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full p-2"
                  onClick={handleImageClick}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {profile?.name || user?.email?.split('@')[0]}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <Badge className={getSubscriptionBadgeColor(profile?.subscription || 'free')}>
                  {profile?.subscription === 'enterprise-annual' ? 'Enterprise Anual' : 
                   profile?.subscription === 'enterprise' ? 'Enterprise' :
                   profile?.subscription === 'premium' ? 'Premium' : 'Free'}
                </Badge>
                {profile?.user_type === 'company_owner' && (
                  <div className="flex items-center justify-center gap-1 text-sm text-amber-600">
                    <Crown className="h-3 w-3" />
                    <span>Proprietário</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Formulário de dados */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </Label>
                  {userAgency ? (
                    <div className="mt-1">
                      <Input
                        value={userAgency.name}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Você faz parte da agência: {userAgency.name}
                      </p>
                    </div>
                  ) : hasEnterprisePlan ? (
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Nome da sua empresa"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1">
                      <Input
                        value="Upgrade para Enterprise necessário"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Disponível apenas no plano Enterprise
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Usuário</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {profile?.user_type === 'company_owner' ? 'Proprietário de Empresa' :
                     profile?.user_type === 'employee' ? 'Funcionário' :
                     profile?.user_type === 'admin' ? 'Administrador' : 'Individual'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Conta criada em</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {profile?.created_at ? 
                    new Date(profile.created_at).toLocaleDateString('pt-BR') : 
                    'Não disponível'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
