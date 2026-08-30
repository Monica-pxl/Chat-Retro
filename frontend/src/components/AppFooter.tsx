import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppFooter() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <footer className="rs-footer">
      <div className="rs-footer__inner">

        {/* Columna 1 — Logo + frase */}
        <div className="rs-footer__col">
          <Link className="rs-logo--footer" to={isAdminRoute ? "/admin" : "/"}>
            <span className="rs-logo__icon">
              <i className="bi bi-display" />
            </span>
            <span className="rs-logo__text">
              <span>Retro</span><span>Chat</span>
            </span>
          </Link>
          <p className="rs-footer__tagline">
            {isAdminRoute ? 'Panel de Control Administrativo' : 'Revive Internet entre 1990 y 2009.'}
          </p>
        </div>

        {/* Columna 2 — Navegación */}
        <div className="rs-footer__col">
          <h4>Navegación</h4>
          <ul>
            {isAuthenticated && isAdminRoute ? (
              <>
                <li><Link to="/admin">Dashboard</Link></li>
                <li><Link to="/admin/usuarios">Gestionar Usuarios</Link></li>
                <li><Link to="/admin/salas">Gestionar Salas</Link></li>
                <li><Link to="/admin/perfil">Perfil</Link></li>
              </>
            ) : isAuthenticated ? (
              <>
                <li><Link to="/">Inicio</Link></li>
                <li><Link to="/salas">Salas</Link></li>
                <li><Link to="/mensajes">Mensajes</Link></li>
                <li><Link to="/solicitudes">Solicitudes</Link></li>
                <li><Link to="/amigos">Amigos</Link></li>
                <li><Link to="/perfil">Perfil</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/">Inicio</Link></li>
                <li><Link to="/salas">Salas</Link></li>
                <li><Link to="/login">Iniciar sesión</Link></li>
                <li><Link to="/registro">Crear cuenta</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Columna 3 — Información */}
        <div className="rs-footer__col">
          <h4>Información</h4>
          <ul>
            <li><a href="#">Acerca de</a></li>
            <li><a href="#">Normas de la comunidad</a></li>
            <li><a href="#">Política de privacidad</a></li>
            <li><a href="#">Términos de uso</a></li>
          </ul>
        </div>

        {/* Columna 4 — Contacto */}
        <div className="rs-footer__col">
          <h4>Contacto</h4>
          <ul>
            <li>
              <a href="mailto:contacto@retrochat.es" className="rs-footer__email">
                contacto@retrochat.es
              </a>
            </li>
          </ul>
        </div>

      </div>
      <div className="rs-footer__bottom">
        © 2026 RetroChat
      </div>
    </footer>
  );
}