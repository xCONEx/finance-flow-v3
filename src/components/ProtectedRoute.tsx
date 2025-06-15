
import React from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import LoginPage from './LoginPage';
import { useTheme } from '../contexts/ThemeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useSupabaseAuth();
  const { currentTheme } = useTheme();

  console.log('🔄 ProtectedRoute state:', { isAuthenticated, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-fadeIn">
        {/* Logo animada */}
        <div className={`w-16 h-16 bg-gradient-to-r ${currentTheme.primary} rounded-xl flex items-center justify-center animate-pulse`}>
          <span className="text-white font-bold text-xl">FF</span>
        </div>

        {/* Nome com gradiente */}
        <span className={`font-bold text-2xl bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}>
          FinanceFlow
        </span>

        {/* Spinner discreto */}
        <div className="mt-4 animate-spin rounded-full h-10 w-10 border-t-2 border-purple-600 border-solid"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
