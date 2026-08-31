import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/footer-pages.css';

export default function AcercaDe() {
  return (
    <div className="fp-page">
      <div className="rs-grid" />
      <AppHeader />

      <section className="fp-hero">
        <div className="fp-hero__inner">
          <span className="fp-hero__badge">✦ Sobre nosotros</span>
          <h1 className="fp-hero__title">Acerca de <span>RetroChat</span></h1>
          <p className="fp-hero__sub">
            Revive la mejor época del internet, desde 1990 hasta 2009
          </p>
        </div>
      </section>

      <main className="fp-main">
        <div className="fp-card">
          <div className="fp-content">
            <h2>¿Qué es RetroChat?</h2>
            <p>
              RetroChat es una plataforma de chat nostálgica que te permite viajar en el tiempo 
              y revivir la experiencia del internet de los años 90 y 2000. Nuestra misión es 
              preservar la esencia de aquella época dorada de la comunicación digital.
            </p>

            <h2>Nuestra historia</h2>
            <p>
              RetroChat nació de la pasión por la cultura digital de los años 90 y 2000. 
              Queríamos crear un espacio donde los usuarios pudieran experimentar la auténtica 
              sensación de aquellos años: desde el diseño de las salas de chat hasta la 
              estética visual que marcó a toda una generación.
            </p>

            <h2>La experiencia RetroChat</h2>
            <p>
              Cada sala de chat en RetroChat está diseñada para transportarte a un año 
              específico entre 1990 y 2009. La ambientación visual, los colores y la tipografía 
              cambian según la época, creando una experiencia inmersiva única.
            </p>

            <div className="fp-features-list">
              <div className="fp-feature-item">
                <i className="bi bi-calendar2-range" />
                <div>
                  <h3>20 años de nostalgia</h3>
                  <p>Salas temáticas para cada año desde 1990 hasta 2009</p>
                </div>
              </div>
              <div className="fp-feature-item">
                <i className="bi bi-chat-dots" />
                <div>
                  <h3>Chats en tiempo real</h3>
                  <p>Conversaciones instantáneas con el estilo de los mensajeros clásicos</p>
                </div>
              </div>
              <div className="fp-feature-item">
                <i className="bi bi-people" />
                <div>
                  <h3>Comunidad activa</h3>
                  <p>Conéctate con otros amantes de la cultura retro</p>
                </div>
              </div>
              <div className="fp-feature-item">
                <i className="bi bi-tv" />
                <div>
                  <h3>Contenido nostálgico</h3>
                  <p>TV Shows, música y eventos temáticos de cada época</p>
                </div>
              </div>
            </div>

            <div className="fp-quote">
              <i className="bi bi-quote" />
              <blockquote>
                "Revive la estética, cultura y entretenimiento del internet de los 90 y 2000"
              </blockquote>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}