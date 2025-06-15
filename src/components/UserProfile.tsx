
import React, { useState, useRef, useEffect } from 'react';
import { User, Save, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, profile, updateProfile, signOut } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  // Carregar dados quando profile mudar
  useEffect(() => {
    if (user && profile) {
      setFormData({
        name: profile.name || user.email || '',
        email: user.email || '',
        phone: profile.phone || '',
        company: profile.company || ''
      });
    }
  }, [user, profile]);

  // Buscar foto do perfil
  const getProfileImageUrl = () => {
    if (profile?.image_user) {
      return profile.image_user;
    }
    
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    
    return '';
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const updateData: any = {};
      
      if (formData.phone !== profile?.phone) {
        updateData.phone = formData.phone;
      }
      
      if (formData.company !== profile?.company) {
        updateData.company = formData.company;
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (user && profile) {
        setFormData({
          name: profile.name || user.email || '',
          email: user.email || '',
          phone: profile.phone || '',
          company: profile.company || ''
        });
      }
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <User className={`text-${currentTheme.accent}`} />
          Meu Perfil
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Informações da sua conta</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Conta</CardTitle>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                disabled={isLoading}
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Photo */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={getProfileImageUrl()} alt={profile?.name || 'User'} />
                <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white text-2xl`}>
                  {formData.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Alterar Foto'}
                  </Button>
                  <p className="text-xs text-gray-500">JPG, PNG até 3MB</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Digite seu nome completo"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">{formData.name || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">{formData.email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">{formData.phone || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Nome da sua empresa"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">{formData.company || 'Não informado'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  {profile?.user_type === 'admin' && 'Administrador do Sistema'}
                  {profile?.user_type === 'company_owner' && 'Dono da Empresa'}
                  {profile?.user_type === 'employee' && 'Colaborador'}
                  {profile?.user_type === 'individual' && 'Usuário Individual'}
                  {!profile?.user_type && 'Individual'}
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  className={`bg-gradient-to-r ${currentTheme.primary}`}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Conta</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Membro desde {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button variant="outline" onClick={signOut}>
                  Sair da Conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
