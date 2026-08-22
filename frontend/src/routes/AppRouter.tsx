import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AdminDashboard from '../pages/AdminPage';
import AdminUsuariosPage from '../pages/AdminUsuariosPage';
import AdminSalasPage from '../pages/AdminSalasPage';
import AdminRoute from '../components/AdminRoute';
import SalasPage from '../pages/SalasPage';
import SalaPage from '../pages/SalaPage';
import PerfilPage from '../pages/PerfilPage';
import MensajesPage from '../pages/MensajesPage';
import SolicitudesPage from '../pages/SolicitudesPage';
import AmigosPage from '../pages/AmigosPage';

interface AppRouterProps {
  children?: ReactNode;
}

export default function AppRouter({ children }: AppRouterProps) {
  return (
    <BrowserRouter>
      {children}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/salas" element={<SalasPage />} />
        <Route path="/salas/:id" element={<SalaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/mensajes" element={<MensajesPage />} />
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/amigos" element={<AmigosPage />} />

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
        <Route
          path="/admin/salas"
          element={
            <AdminRoute>
              <AdminSalasPage />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}