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
  const [userAgency, setUserAgency] = useState<any>(null);
  const [isAgencyCollaborator, setIsAgencyCollaborator] = useState(false);

  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';
  const hasPremiumPlan = profile?.subscription === 'premium' || hasEnterprisePlan;

  // Buscar a agência do usuário e verificar se é colaborador
  useEffect(() => {
    const fetchUserAgencyInfo = async () => {
      console.log('🔍 Buscando informações da agência do usuário...', { 
        agencyId: profile?.agency_id, 
        userId: user?.id,
        agencies: agencies
      });

      // Verificar se o usuário é colaborador ou owner de alguma agência
      // Se agencies tem dados, significa que o usuário faz parte de pelo menos uma agência
      if (agencies && agencies.length > 0) {
        const userAgencyData = agencies[0]; // Pegar a primeira agência (ou a ativa)
        console.log('✅ Usuário faz parte da agência:', userAgencyData.name);
        setUserAgency(userAgencyData);
        setIsAgencyCollaborator(true);
      } else if (profile?.agency_id) {
        // Buscar agência pelo agency_id do perfil (fallback)
        try {
          const { data, error } = await supabase
            .from('agencies')
            .select('id, name, description, owner_id')
            .eq('id', profile.agency_id)
            .single();

          console.log('📊 Resultado da busca de agência por agency_id:', { data, error });

          if (!error && data) {
            setUserAgency(data);
            setIsAgencyCollaborator(true);
            console.log('✅ Agência encontrada por agency_id:', data.name);
          } else {
            console.log('❌ Erro ou agência não encontrada por agency_id:', error);
            setUserAgency(null);
            setIsAgencyCollaborator(false);
          }
        } catch (error) {
          console.error('🚨 Erro ao buscar agência por agency_id:', error);
          setUserAgency(null);
          setIsAgencyCollaborator(false);
        }
      } else {
        console.log('ℹ️ Usuário não possui agência');
        setUserAgency(null);
        setIsAgencyCollaborator(false);
      }
    };

    fetchUserAgencyInfo();
  }, [profile?.agency_id, user?.id, agencies]);

  // Verificar se é dono da agência
  const isAgencyOwner = userAgency && (userAgency.is_owner || userAgency.owner_id === user?.id);

  console.log('🏢 Estado da agência:', {
    userAgency,
    isAgencyOwner,
    isAgencyCollaborator,
    profileAgencyId: profile?.agency_id,
    userId: user?.id,
    hasPremiumPlan,
    agenciesCount: agencies?.length || 0
  });

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
                {isAgencyOwner && (
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
                  {isAgencyCollaborator && userAgency ? (
                    <div className="mt-1">
                      <Input
                        value={userAgency.name}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {isAgencyOwner ? 'Você é proprietário desta agência' : 'Você faz parte desta agência'}
                      </p>
                    </div>
                  ) : hasPremiumPlan ? (
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
                        value="Upgrade para Premium necessário"
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Disponível apenas no plano Premium ou Enterprise
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

              {userAgency && (
                <div className="md:col-span-2">
                  <Label>Agência</Label>
                  <div className="mt-1">
                    <p className="text-sm font-medium">{userAgency.name}</p>
                    {userAgency.description && (
                      <p className="text-xs text-gray-500">{userAgency.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
