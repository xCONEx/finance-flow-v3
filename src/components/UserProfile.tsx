
import React, { useState } from 'react';
import { User, Save, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: ''
  });

  const handleSave = async () => {
    try {
      // Aqui você implementaria a lógica para salvar no Firebase
      console.log('Salvando dados do usuário:', formData);
      
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
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Photo */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || ''} alt={user?.name || 'User'} />
                <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white text-2xl`}>
                  {formData.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>
                  <p className="text-xs text-gray-500">JPG, PNG até 2MB</p>
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
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">{formData.email}</p>
                  )}
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
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">{formData.company || 'Não informado'}</p>
                  )}
                </div>
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

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  className={`bg-gradient-to-r ${currentTheme.primary}`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
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
