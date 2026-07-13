import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SalasPage from '../pages/SalasPage';
import SalaPage from '../pages/SalaPage';
import PerfilPage from '../pages/PerfilPage';

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
      </Routes>
    </BrowserRouter>
  );
}
