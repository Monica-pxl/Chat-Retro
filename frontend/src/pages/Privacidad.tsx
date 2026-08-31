import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/footer-pages.css';

export default function Privacidad() {
  return (
    <div className="fp-page">
      <div className="rs-grid" />
      <AppHeader />

      <section className="fp-hero">
        <div className="fp-hero__inner">
          <span className="fp-hero__badge">✦ Privacidad</span>
          <h1 className="fp-hero__title">Política de <span>Privacidad</span></h1>
          <p className="fp-hero__sub">
            Cómo protegemos y gestionamos tus datos personales
          </p>
        </div>
      </section>

      <main className="fp-main">
        <div className="fp-card">
          <div className="fp-content">
            <div className="fp-section">
              <h2>1. Información que recopilamos</h2>
              <p>
                En RetroChat recopilamos la siguiente información para ofrecerte 
                una experiencia personalizada y segura:
              </p>
              <ul>
                <li><strong>Datos de registro:</strong> Email, nickname y contraseña</li>
                <li><strong>Información de perfil:</strong> Avatar y estado</li>
                <li><strong>Mensajes:</strong> Contenido de tus conversaciones públicas y privadas</li>
                <li><strong>Datos de actividad:</strong> Fechas de registro y última conexión</li>
              </ul>
            </div>

            <div className="fp-section">
              <h2>2. Uso de la información</h2>
              <p>Utilizamos tus datos para:</p>
              <ul>
                <li>Identificarte y autenticarte en la plataforma</li>
                <li>Mostrar tu perfil a otros usuarios</li>
                <li>Gestionar tus mensajes y amistades</li>
                <li>Mejorar la experiencia de usuario</li>
              </ul>
            </div>

            <div className="fp-section">
              <h2>3. Seguridad de los datos</h2>
              <p>
                Tus contraseñas están encriptadas y nunca las almacenamos en texto plano. 
                Utilizamos medidas de seguridad estándar para proteger tu información contra 
                accesos no autorizados.
              </p>
            </div>

            <div className="fp-section">
              <h2>4. Tus derechos</h2>
              <p>Tienes derecho a:</p>
              <ul>
                <li>Acceder a tus datos personales</li>
                <li>Modificar tu información de perfil</li>
                <li>Solicitar la eliminación de tu cuenta</li>
                <li>Cancelar el envío de notificaciones</li>
              </ul>
            </div>

            <div className="fp-section">
              <h2>5. Contacto</h2>
              <p>
                Si tienes preguntas sobre esta política, puedes contactarnos en 
                <a href="mailto:contacto@retrochat.es" className="fp-link"> contacto@retrochat.es</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}