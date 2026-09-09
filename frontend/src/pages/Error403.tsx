import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/error.css';

export default function Error403() {
  const { user } = useAuth();

  return (
    <div className="error-page error-page--403">
      <AppHeader />
      <div className="error-container">
        <div className="error-content">
          <span className="error-code">403</span>
          <h1 className="error-title">Acceso denegado</h1>
          <p className="error-description">
            {user 
              ? 'No tienes los permisos necesarios para acceder a esta página. Si crees que esto es un error, contacta con el administrador.'
              : 'Necesitas iniciar sesión para acceder a esta página.'}
          </p>
          <div className="error-actions">
            {user ? (
              <Link to="/" className="error-btn error-btn--primary">
                <i className="bi bi-house-fill" /> Volver al inicio
              </Link>
            ) : (
              <>
                <Link to="/login" className="error-btn error-btn--primary">
                  <i className="bi bi-box-arrow-in-right" /> Iniciar sesión
                </Link>
                <Link to="/" className="error-btn error-btn--secondary">
                  <i className="bi bi-house-fill" /> Volver al inicio
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="error-illustration">
          <i className="bi bi-shield-slash" />
        </div>
      </div>
      <AppFooter />
    </div>
  );
}