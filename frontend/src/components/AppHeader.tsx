import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivateMessages } from '../context/PrivateMessagesContext';
import UserSearchBar from './UserSearchBar';

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalUnread, pendingReceivedCount } = usePrivateMessages();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  const mostrarBadgeSolicitudes = pendingReceivedCount > 0 && location.pathname !== '/solicitudes';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="rs-header">
      {/* BANNER DE SUSPENSIÓN */}
      {isAuthenticated && user?.estado_cuenta === 'suspendida' && (
        <div className="rs-suspension-banner">
          <i className="bi bi-exclamation-triangle-fill" />
          Tu cuenta está suspendida. No puedes enviar mensajes ni unirte a salas.
        </div>
      )}

      <div className="rs-header__inner">
        <Link className="rs-logo" to={isAdminRoute ? "/admin" : "/"}>
          <span className="rs-logo__icon">
            <i className="bi bi-display" />
          </span>
          <span className="rs-logo__text">
            <span>Retro</span><span>Chat</span>
          </span>
          {isAdminRoute && (
            <span className="rs-logo__badge">Admin</span>
          )}
        </Link>

        {/* ✅ Menú hamburguesa para móvil */}
        <input type="checkbox" id="menu-toggle" className="rs-menu-toggle" />
        <label htmlFor="menu-toggle" className="rs-menu-btn">
          <i className="bi bi-list" />
        </label>

        <nav className="rs-header__nav">
          
          {/* ─── MENÚ ADMIN ─── */}
          {isAuthenticated && isAdminRoute ? (
            <>
              <Link to="/admin" className="rs-btn rs-btn--nav rs-btn--admin-active">
                <i className="bi bi-house-fill" /> <span>Dashboard</span>
              </Link>
              
              <Link to="/admin/usuarios" className="rs-btn rs-btn--nav rs-btn--admin">
                <i className="bi bi-people-fill" /> <span>Usuarios</span>
              </Link>
              <Link to="/admin/salas" className="rs-btn rs-btn--nav rs-btn--admin">
                <i className="bi bi-door-open-fill" /> <span>Salas</span>
              </Link>

              <Link to="/admin/perfil" className="rs-header__user">
                <i className="bi bi-person-circle" />
                <span>{user?.nickname}</span>
              </Link>

              <button className="rs-btn rs-btn--nav rs-btn--ghost" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" /> <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            /* ─── MENÚ USUARIO NORMAL ─── */
            <>
              {isAuthenticated ? (
                <>
                  <Link to="/salas" className="rs-btn rs-btn--nav">
                    <i className="bi bi-grid-3x3-gap" /> <span>Salas</span>
                  </Link>
                  <UserSearchBar />
                  <Link to="/mensajes" className="rs-btn rs-btn--nav rs-nav-link-wrap">
                    <i className="bi bi-chat-dots" /> <span>Mensajes</span>
                    {totalUnread > 0 && <span className="rs-nav-badge" />}
                  </Link>
                  <Link to="/solicitudes" className="rs-btn rs-btn--nav rs-nav-link-wrap">
                    <i className="bi bi-person-plus" /> <span>Solicitudes</span>
                    {mostrarBadgeSolicitudes && <span className="rs-nav-badge rs-nav-badge--orange" />}
                  </Link>
                  <Link to="/amigos" className="rs-btn rs-btn--nav">
                    <i className="bi bi-people" /> <span>Amigos</span>
                  </Link>
                  <Link to="/perfil" className="rs-header__user">
                    <i className="bi bi-person-circle" />
                    <span>{user?.nickname}</span>
                  </Link>
                  <button className="rs-btn rs-btn--nav rs-btn--ghost" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right" /> <span>Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rs-btn rs-btn--nav rs-btn--ghost">
                    <i className="bi bi-box-arrow-in-right" /> <span>Iniciar sesión</span>
                  </Link>
                  <Link to="/registro" className="rs-btn rs-btn--nav rs-btn--primary">
                    <i className="bi bi-person-plus" /> <span>Crear cuenta</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}