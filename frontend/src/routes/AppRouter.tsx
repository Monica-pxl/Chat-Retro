import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SalasPage from '../pages/SalasPage';
import SalaPage from '../pages/SalaPage';
import PerfilPage from '../pages/PerfilPage';
import MensajesPage from '../pages/MensajesPage';
import SolicitudesPage from '../pages/SolicitudesPage';
import AmigosPage from '../pages/AmigosPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}
