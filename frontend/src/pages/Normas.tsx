import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/footer-pages.css';

export default function Normas() {
  return (
    <div className="fp-page">
      <div className="rs-grid" />
      <AppHeader />

      <section className="fp-hero">
        <div className="fp-hero__inner">
          <span className="fp-hero__badge">✦ Normas</span>
          <h1 className="fp-hero__title">Normas de la <span>Comunidad</span></h1>
          <p className="fp-hero__sub">
            Reglas básicas para mantener un ambiente respetuoso y nostálgico
          </p>
        </div>
      </section>

      <main className="fp-main">
        <div className="fp-card">
          <div className="fp-content">
            <div className="fp-rule">
              <span className="fp-rule-number">01</span>
              <div>
                <h3>Respeta a los demás</h3>
                <p>
                  Trata a todos los usuarios con respeto y cortesía. No toleramos 
                  el acoso, la discriminación ni el lenguaje ofensivo.
                </p>
              </div>
            </div>

            <div className="fp-rule">
              <span className="fp-rule-number">02</span>
              <div>
                <h3>Contenido apropiado</h3>
                <p>
                  No compartas contenido inapropiado, violento o ilegal. RetroChat 
                  es un espacio para disfrutar de la nostalgia de forma segura.
                </p>
              </div>
            </div>

            <div className="fp-rule">
              <span className="fp-rule-number">03</span>
              <div>
                <h3>Sin spam ni autopromoción</h3>
                <p>
                  No utilices RetroChat para hacer spam o promocionar productos o 
                  servicios sin autorización previa.
                </p>
              </div>
            </div>

            <div className="fp-rule">
              <span className="fp-rule-number">04</span>
              <div>
                <h3>Mantén el espíritu retro</h3>
                <p>
                  Aunque no es obligatorio, te animamos a mantener un lenguaje y 
                  comportamiento acorde a la época que estamos reviviendo.
                </p>
              </div>
            </div>

            <div className="fp-rule">
              <span className="fp-rule-number">05</span>
              <div>
                <h3>Cuentas suspendidas y baneos</h3>
                <p>
                  El incumplimiento de estas normas puede resultar en la suspensión 
                  o baneo de tu cuenta, dependiendo de la gravedad de la falta.
                </p>
              </div>
            </div>

            <div className="fp-rule">
              <span className="fp-rule-number">06</span>
              <div>
                <h3>Reporta comportamientos inapropiados</h3>
                <p>
                  Si ves a alguien incumpliendo las normas, utiliza el sistema de 
                  reporte para notificarlo a los administradores.
                </p>
              </div>
            </div>

            <div className="fp-rule-note">
              <i className="bi bi-info-circle" />
              <p>
                Estas normas pueden actualizarse periódicamente. Te recomendamos 
                revisarlas de vez en cuando para estar al día.
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}