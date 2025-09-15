import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Se não houver usuário logado, redireciona para a página de login
    return <Navigate to="/login" />;
  }

  // Se houver um usuário logado, renderiza o componente filho
  return <>{children}</>;
};

export default ProtectedRoute;
