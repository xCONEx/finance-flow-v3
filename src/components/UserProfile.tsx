
import React, { useState, useRef, useEffect } from 'react';
import { User, Save, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { firestoreService } from '../services/firestore';

const UserProfile = () => {
  const { user, logout, userData, agencyData } = useAuth();
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

  // Carregar dados quando userData mudar
  useEffect(() => {
    if (user && userData) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: userData.personalInfo?.phone || userData.phone || '',
        company: userData.personalInfo?.company || userData.company || ''
      });
    }
  }, [user, userData]);

  // Buscar foto do Google se disponível
  const getProfileImageUrl = () => {
    // Prioridade: 1. Foto customizada 2. Foto do Google 3. Avatar padrão
    if (userData?.imageuser) {
      return userData.imageuser;
    }
    
    // Verificar se o usuário tem photoURL do Google
    if (user?.photoURL) {
      return user.photoURL;
    }
    
    return '';
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Salvar dados no Firebase
      const updateData: any = {};
      
      if (formData.phone !== (userData?.personalInfo?.phone || userData?.phone)) {
        updateData.phone = formData.phone;
      }
      
      if (formData.company !== (userData?.personalInfo?.company || userData?.company)) {
        updateData.company = formData.company;
      }
      
      if (Object.keys(updateData).length > 0) {
        await firestoreService.updateUserField(user.id, 'personalInfo', {
          phone: formData.phone,
          company: formData.company
        });
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

    // Verificar tamanho do arquivo (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 3MB.",
        variant: "destructive"
      });
      return;
    }

    // Verificar tipo do arquivo
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
      // Converter para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          // Salvar no Firebase como imageuser
          await firestoreService.updateUserField(user.id, 'imageuser', base64);
          
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
      // Cancelar edição - restaurar dados originais
      if (user && userData) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: userData.personalInfo?.phone || userData.phone || '',
          company: userData.personalInfo?.company || userData.company || ''
        });
      }
    }
    setIsEditing(!isEditing);
  };

  // Determinar se o usuário está em uma empresa
  const isInCompany = user?.userType === 'company_owner' || user?.userType === 'employee';
  const companyName = agencyData?.name || 'Empresa não encontrada';

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
                <AvatarImage src={getProfileImageUrl()} alt={user?.name || 'User'} />
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
                  {user?.photoURL && !userData?.imageuser && (
                    <p className="text-xs text-blue-600">Foto atual: Google Account</p>
                  )}
                </div>
              )}
            </div>

            {/* User Info Form */}
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
                 <Label>Tipo de Usuário</Label>
                <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  {user?.userType === 'admin' && 'Administrador do Sistema'}
                  {user?.userType === 'company_owner' && 'Dono da Empresa'}
                  {user?.userType === 'employee' && 'Colaborador'}
                  {user?.userType === 'individual' && 'Usuário Individual'}
                </p>
                </div>
              </div>

            
            </div>

            {/* Save Button */}
            {isEditing && !isInCompany && (
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

            {/* Account Actions */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Conta</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Membro desde {new Date(user?.createdAt || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button variant="outline" onClick={logout}>
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
