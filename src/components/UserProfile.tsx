import React, { useState, useRef, useEffect } from 'react';
import { User, Save, Upload, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';
import { toast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, profile, updateProfile, signOut } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const { subscription } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Aqui vamos guardar o nome da empresa vinculada (se existir)
  const [linkedCompanyName, setLinkedCompanyName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  // Função para pegar o nome do usuário, igual antes
  const getUserDisplayName = () => {
    if (profile?.name) {
      return profile.name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    return user?.email?.split('@')[0] || '';
  };

  // Detectar plano enterprise
  const isEnterpriseUser = subscription === 'enterprise' || subscription === 'enterprise-annual';

  // Carregar dados quando profile/user mudar
  useEffect(() => {
    if (user && profile) {
      // Se o profile tem empresa vinculada, usar o nome dela. Supondo que você tem essa info:
      // Exemplo: profile.company_name (empresa vinculada) ou null se não tem
      if (profile.company_name) {
        setLinkedCompanyName(profile.company_name);
      } else {
        setLinkedCompanyName(null);
      }

      setFormData({
        name: getUserDisplayName(),
        email: user.email || '',
        phone: profile.phone || '',
        // Se usuário tem empresa vinculada, no formData.company deixamos vazio
        // para não editar esse campo, pois vamos mostrar linkedCompanyName
        company: '', 
      });
    }
  }, [user, profile]);

  // Pega URL da foto de perfil
  const getProfileImageUrl = () => {
    if (profile?.image_user) {
      return profile.image_user;
    }
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return '';
  };

  // Função salvar
  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const updateData: any = {};

      if (formData.phone !== profile?.phone) {
        updateData.phone = formData.phone;
      }

      // Se usuário NÃO tem empresa vinculada, então salvar o que ele digitou
      if (!linkedCompanyName) {
        // Se plano enterprise, salva company que ele digitou
        if (isEnterpriseUser && formData.company !== profile?.company) {
          updateData.company = formData.company;
        }
        // Se não for enterprise, salva mesmo assim pois campo livre
        if (!isEnterpriseUser && formData.company !== profile?.company) {
          updateData.company = formData.company;
        }
      }

      if (formData.name !== profile?.name) {
        updateData.name = formData.name;
      }

      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);
      }

      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  // Upload de foto (igual seu código)
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 3MB.",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        try {
          await updateProfile({ image_user: base64 });

          toast({
            title: "Foto Atualizada",
            description: "Sua foto de perfil foi atualizada com sucesso.",
          });
        } catch (error) {
          console.error('Erro ao salvar foto:', error);
          toast({
            title: "Erro",
            description: "Erro ao salvar foto.",
            variant: "destructive"
          });
        }
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar imagem.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Mudança em inputs
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cor do badge plano
  const getPlanBadgeColor = () => {
    switch (subscription) {
      case 'enterprise':
      case 'enterprise-annual':
        return 'bg-purple-100 text-purple-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'basic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Nome do plano
  const getPlanName = () => {
    switch (subscription) {
      case 'enterprise':
        return 'Enterprise';
      case 'enterprise-annual':
        return 'Enterprise Anual';
      case 'premium':
        return 'Premium';
      case 'basic':
        return 'Básico';
      default:
        return 'Gratuito';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Usuário
            </div>
            <Badge className={getPlanBadgeColor()}>
              {getPlanName()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={getProfileImageUrl()} alt="Profile" />
              <AvatarFallback className={`text-white text-xl bg-gradient-to-r ${currentTheme.primary}`}>
                {getUserDisplayName() ? getUserDisplayName().charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Alterar Foto
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={formData.email}
                disabled={true}
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing || isLoading}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
                {!isEnterpriseUser && (
                  <Badge variant="outline" className="text-xs">
                    Enterprise
                  </Badge>
                )}
              </Label>

              {/* Se tem empresa vinculada, mostrar nome fixo (disabled) */}
              {linkedCompanyName ? (
                <Input
                  id="company"
                  value={linkedCompanyName}
                  disabled={true}
                  className="bg-gray-50 cursor-not-allowed"
                />
              ) : (
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  disabled={!isEditing || isLoading || (!isEnterpriseUser && !isEditing ? true : false)}
                  placeholder={isEnterpriseUser ? "Nome da empresa" : "Disponível no plano Enterprise"}
                  className={!isEnterpriseUser ? "bg-gray-50" : ""}
                />
              )}

              {!isEnterpriseUser && !linkedCompanyName && isEditing && (
                <p className="text-xs text-gray-500">
                  O campo empresa está disponível apenas para usuários do plano Enterprise
                </p>
              )}
              {linkedCompanyName && (
                <p className="text-xs text-gray-500">
                  Você pertence à empresa acima, este campo não pode ser editado.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 bg-gradient-to-r ${currentTheme.primary}`}
                >
                  Editar Perfil
                </Button>
                <Button
                  variant="outline"
                  onClick={signOut}
                  className="flex-1"
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`flex-1 bg-gradient-to-r ${currentTheme.primary}`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data e linkedCompanyName
                    if (user && profile) {
                      if (profile.company_name) {
                        setLinkedCompanyName(profile.company_name);
                      } else {
                        setLinkedCompanyName(null);
                      }
                      setFormData({
                        name: getUserDisplayName(),
                        email: user.email || '',
                        phone: profile.phone || '',
                        company: '',
                      });
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
