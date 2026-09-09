import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/error.css';

export default function Error500() {
  return (
    <div className="error-page error-page--500">
      <AppHeader />
      <div className="error-container">
        <div className="error-content">
          <span className="error-code">500</span>
          <h1 className="error-title">Error del servidor</h1>
          <p className="error-description">
            Lo sentimos, algo salió mal en el servidor.
            <br />
            Por favor, inténtalo de nuevo más tarde. Si el problema persiste, contacta con el administrador.
          </p>
          <div className="error-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="error-btn error-btn--primary"
            >
              <i className="bi bi-arrow-repeat" /> Reintentar
            </button>
            <Link to="/" className="error-btn error-btn--secondary">
              <i className="bi bi-house-fill" /> Volver al inicio
            </Link>
          </div>
        </div>
        <div className="error-illustration">
          <i className="bi bi-server" />
        </div>
      </div>
      <AppFooter />
    </div>
  );
}