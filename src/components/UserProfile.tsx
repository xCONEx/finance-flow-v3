
import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();

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
            <CardTitle>Conta</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || ''} alt={user?.name || 'User'} />
                <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white text-2xl`}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{user?.name || 'Usuário'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.userType === 'admin' && 'Administrador do Sistema'}
                  {user?.userType === 'company_owner' && 'Dono da Empresa'}
                  {user?.userType === 'employee' && 'Colaborador'}
                  {user?.userType === 'individual' && 'Usuário Individual'}
                </p>
              </div>
            </div>

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
