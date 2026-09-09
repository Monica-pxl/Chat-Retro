import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import AcercaDe from '../pages/AcercaDe';
import Normas from '../pages/Normas';
import Privacidad from '../pages/Privacidad';
import Terminos from '../pages/Terminos';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AdminDashboard from '../pages/AdminPage';
import AdminUsuariosPage from '../pages/AdminUsuariosPage';
import AdminSalasPage from '../pages/AdminSalasPage';
import AdminRoute from '../components/AdminRoute';
import ProtectedRoute from '../components/ProtectedRoute';
import SalasPage from '../pages/SalasPage';
import SalaPage from '../pages/SalaPage';
import PerfilPage from '../pages/PerfilPage';
import MensajesPage from '../pages/MensajesPage';
import SolicitudesPage from '../pages/SolicitudesPage';
import AmigosPage from '../pages/AmigosPage';
import ScrollToTop from '../components/ScrollToTop';
import Error404 from '../pages/Error404';
import Error403 from '../pages/Error403';
import Error500 from '../pages/Error500';

interface AppRouterProps {
  children?: ReactNode;
}

// COMPONENTE PARA REDIRIGIR ADMIN A DASHBOARD, para que no peudan entrar a rutas
//de usuarios normales:
function RedirectAdminToDashboard({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.rol === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

export default function AppRouter({ children }: AppRouterProps) {
  return (
    <BrowserRouter>
      {children}
      <ScrollToTop />
      <Routes>
        {/* Rutas públicas (sin autenticación) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/acerca-de" element={<AcercaDe />} />
        <Route path="/normas" element={<Normas />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />

        {/* 🔥 RUTAS DE SALAS - PÚBLICAS (invitados pueden ver, admin redirigido) */}
        <Route
          path="/salas"
          element={
            <RedirectAdminToDashboard>
              <SalasPage />
            </RedirectAdminToDashboard>
          }
        />
        <Route
          path="/salas/:id"
          element={
            <RedirectAdminToDashboard>
              <SalaPage />
            </RedirectAdminToDashboard>
          }
        />

        {/* Rutas protegidas (solo autenticados) */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mensajes"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <MensajesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <SolicitudesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/amigos"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <AmigosPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas de Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <AdminRoute>
              <AdminUsuariosPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/salas"
          element={
            <AdminRoute>
              <AdminSalasPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/perfil"
          element={
            <AdminRoute>
              <PerfilPage />
            </AdminRoute>
          }
        />

        <Route path="/error/403" element={<Error403 />} />
        <Route path="/error/500" element={<Error500 />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  );
}