import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/footer-pages.css';

export default function Terminos() {
  return (
    <div className="fp-page">
      <div className="rs-grid" />
      <AppHeader />

      <section className="fp-hero">
        <div className="fp-hero__inner">
          <span className="fp-hero__badge">✦ Términos</span>
          <h1 className="fp-hero__title">Términos de <span>Uso</span></h1>
          <p className="fp-hero__sub">
            Condiciones para usar RetroChat y sus servicios
          </p>
        </div>
      </section>

      <main className="fp-main">
        <div className="fp-card">
          <div className="fp-content">
            <div className="fp-section">
              <h2>1. Aceptación de los términos</h2>
              <p>
                Al registrarte y usar RetroChat, aceptas cumplir con estos términos 
                de uso. Si no estás de acuerdo, no debes utilizar la plataforma.
              </p>
            </div>

            <div className="fp-section">
              <h2>2. Registro y cuenta</h2>
              <ul>
                <li>Debes proporcionar información veraz durante el registro</li>
                <li>Eres responsable de mantener la seguridad de tu cuenta</li>
                <li>No debes compartir tu contraseña con terceros</li>
                <li>RetroChat se reserva el derecho de suspender cuentas que incumplan las normas</li>
              </ul>
            </div>

            <div className="fp-section">
              <h2>3. Propiedad intelectual</h2>
              <p>
                El contenido de RetroChat (logo, diseño, código) es propiedad de 
                RetroChat. No está permitida su reproducción sin autorización.
              </p>
            </div>

            <div className="fp-section">
              <h2>4. Contenido generado por el usuario</h2>
              <p>
                Eres responsable del contenido que publicas en la plataforma. 
                RetroChat no se hace responsable de los mensajes enviados por los usuarios.
              </p>
            </div>

            <div className="fp-section">
              <h2>5. Limitación de responsabilidad</h2>
              <p>
                RetroChat se ofrece "tal cual" sin garantías de ningún tipo. 
                No nos responsabilizamos por daños derivados del uso de la plataforma.
              </p>
            </div>

            <div className="fp-section">
              <h2>6. Cambios en los términos</h2>
              <p>
                RetroChat puede actualizar estos términos en cualquier momento. 
                Te notificaremos sobre cambios importantes.
              </p>
            </div>

            <div className="fp-section">
              <h2>7. Contacto</h2>
              <p>
                Para cualquier consulta sobre estos términos, escríbenos a 
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