//Protege rutas que solo pueden ser accedidas por usuarios autenticados con roles específicos:
//en rutas como: /perfil, /mensajes, /amigos:
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('user' | 'admin')[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['user', 'admin'],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  // 🔥 COMPROBACIÓN EXPLÍCITA
  const isLoggedIn = isAuthenticated && user !== null && user !== undefined;
  const userRole = user?.rol ?? ''; // Si no tiene rol, string vacío
  const hasValidRole = allowedRoles.includes(userRole as 'user' | 'admin');

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!hasValidRole) {
    return <Navigate to="/error/403" replace />;
  }

  return children;
}