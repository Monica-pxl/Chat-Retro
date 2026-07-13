import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="rs-header">
      <div className="rs-header__inner">
        <Link className="rs-logo" to="/">
          <span className="rs-logo__icon">
            <i className="bi bi-display" />
          </span>
          <span className="rs-logo__text">
            <span>Retro</span><span>Chat</span>
          </span>
        </Link>

        <nav className="rs-header__nav">
          <Link to="/salas" className="rs-btn rs-btn--nav">
            <i className="bi bi-grid-3x3-gap" /> Salas
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/perfil" className="rs-header__user">
                <i className="bi bi-person-circle" />
                {user?.nickname}
              </Link>
              <button
                className="rs-btn rs-btn--nav rs-btn--ghost"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rs-btn rs-btn--nav rs-btn--ghost">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="rs-btn rs-btn--nav rs-btn--primary">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
