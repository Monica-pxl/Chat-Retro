import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppFooter() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="rs-footer">
      <div className="rs-footer__inner">

        {/* Columna 1 — Logo + frase */}
        <div className="rs-footer__col">
          <Link className="rs-logo--footer" to="/">
            <span className="rs-logo__icon">
              <i className="bi bi-display" />
            </span>
            <span className="rs-logo__text">
              <span>Retro</span><span>Chat</span>
            </span>
          </Link>
          <p className="rs-footer__tagline">Revive Internet entre 1990 y 2009.</p>
        </div>

        {/* Columna 2 — Navegación (según autenticación) */}
        <div className="rs-footer__col">
          <h4>Navegación</h4>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/salas">Salas</Link></li>
            {isAuthenticated ? (
              <>
                <li><Link to="/perfil">Perfil</Link></li>
                {/* Aquí puedes añadir más enlaces para usuarios logueados */}
              </>
            ) : (
              <>
                <li><Link to="/login">Iniciar sesión</Link></li>
                <li><Link to="/registro">Crear cuenta</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Columna 3 — Información (siempre visible) */}
        <div className="rs-footer__col">
          <h4>Información</h4>
          <ul>
            <li><a href="#">Acerca de</a></li>
            <li><a href="#">Normas de la comunidad</a></li>
            <li><a href="#">Política de privacidad</a></li>
            <li><a href="#">Términos de uso</a></li>
          </ul>
        </div>

        {/* Columna 4 — Contacto (siempre visible) */}
        <div className="rs-footer__col">
          <h4>Contacto</h4>
          <ul>
            <li>
              <a href="mailto:contacto@retrosocial.es" className="rs-footer__email">
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