import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivateMessages } from '../context/PrivateMessagesContext';
import UserSearchBar from './UserSearchBar';

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalUnread, pendingReceivedCount } = usePrivateMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const mostrarBadgeSolicitudes = pendingReceivedCount > 0 && location.pathname !== '/solicitudes';

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
              <UserSearchBar />
              <Link to="/mensajes" className="rs-btn rs-btn--nav rs-nav-link-wrap">
                <i className="bi bi-chat-dots" /> Mensajes
                {totalUnread > 0 && <span className="rs-nav-badge" />}
              </Link>
              <Link to="/solicitudes" className="rs-btn rs-btn--nav rs-nav-link-wrap">
                <i className="bi bi-person-plus" /> Solicitudes
                {mostrarBadgeSolicitudes && <span className="rs-nav-badge rs-nav-badge--orange" />}
              </Link>
              <Link to="/amigos" className="rs-btn rs-btn--nav">
                <i className="bi bi-people" /> Amigos
              </Link>
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
