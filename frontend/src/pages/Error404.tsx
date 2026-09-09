import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/error.css';

export default function Error404() {
  return (
    <div className="error-page error-page--404">
      <AppHeader />
      <div className="error-container">
        <div className="error-content">
          <span className="error-code">404</span>
          <h1 className="error-title">Página no encontrada</h1>
          <p className="error-description">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
            <br />
            Puede que el enlace esté roto o que la página haya sido eliminada.
          </p>
          <div className="error-actions">
            <Link to="/" className="error-btn error-btn--primary">
              <i className="bi bi-house-fill" /> Volver al inicio
            </Link>
            <Link to="/salas" className="error-btn error-btn--secondary">
              <i className="bi bi-grid-3x3-gap" /> Explorar salas
            </Link>
          </div>
        </div>
        <div className="error-illustration">
          <i className="bi bi-binoculars" />
        </div>
      </div>
      <AppFooter />
    </div>
  );
}