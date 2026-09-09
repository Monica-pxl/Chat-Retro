//Protege rutas que solo pueden ser accedidas por administradores:
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAuth();

  console.log('🔥 ADMIN ROUTE - isAuthenticated:', isAuthenticated);
  console.log('🔥 ADMIN ROUTE - user:', user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}