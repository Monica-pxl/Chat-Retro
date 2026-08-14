import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: JSX.Element;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const raw = localStorage.getItem('rs_user');
  const storedUser = raw ? JSON.parse(raw) : null;

  console.log('🔥 ADMIN ROUTE:', storedUser);
  console.log('🔥 ROL:', storedUser?.rol);

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  if (storedUser.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}