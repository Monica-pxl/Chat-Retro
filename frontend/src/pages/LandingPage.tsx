import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  accent: string;
}

const features: Feature[] = [
  {
    icon: 'bi-calendar2-range',
    title: 'Salas por Era',
    desc: 'Entra a salas temáticas organizadas por año, desde 1990 hasta 2009. Revive la atmósfera de cada época del internet.',
    tag: '1990 – 2009',
    accent: 'var(--accent-cyan)',
  },
  {
    icon: 'bi-chat-dots',
    title: 'Chats Privados',
    desc: 'Envía mensajes directos a cualquier usuario. Conversaciones en tiempo real con el estilo de los mensajeros clásicos.',
    tag: 'Tiempo real',
    accent: 'var(--accent-pink)',
  },
  {
    icon: 'bi-person-check',
    title: 'Sistema de Amigos',
    desc: 'Agrega contactos, acepta solicitudes y mantén tu propia lista de amigos al estilo de MSN Messenger.',
    tag: 'Lista de contactos',
    accent: 'var(--accent-purple)',
  },
];

const specialFeatures: Feature[] = [
  {
    icon: 'bi-images',
    title: 'Multimedia',
    desc: 'Comparte imágenes, GIFs y audios en tus chats privados. Dale vida a tus conversaciones.',
    tag: 'Imágenes · GIFs · Audio',
    accent: 'var(--accent-yellow)',
  },
  {
    icon: 'bi-tv',
    title: 'TV Shows',
    desc: 'Salas especiales con emisión de televisión nostálgica. Programación por horario como en los 90 y 2000.',
    tag: 'Teletienda · Series',
    accent: 'var(--accent-orange)',
  },
  {
    icon: 'bi-star',
    title: 'Salas Especiales',
    desc: 'Fiesta, Tropical, Navidad... Salas temáticas disponibles en fechas y horarios concretos.',
    tag: 'Eventos · Temporales',
    accent: 'var(--accent-green)',
  },
];

// TODOS los años del 1990 al 2009
const allYears: number[] = [];
for (let y = 1990; y <= 2009; y++) {
  allYears.push(y);
}

export default function LandingPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="rs-landing">

      {/* ── Grid de fondo ── */}
      <div className="rs-grid" />

      <AppHeader />

      {/* ── Hero ── */}
      <section className="rs-hero">
        <div className="rs-hero__content">
          <span className="rs-hero__badge">✦ 1990 — 2009</span>
          <h1 className="rs-hero__title">
            <span className="glitch-text" data-text="RetroChat">RetroChat</span>
          </h1>
          <p className="rs-hero__sub">
            Revive la estética, cultura y entretenimiento del internet de los 90 y 2000
          </p>
          <div className="rs-hero__actions">
            <button className="rs-btn rs-btn--hero rs-btn--primary" onClick={() => navigate('/salas')}>
              <i className="bi bi-door-open" /> Explorar salas
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats rápidos ── */}
      <section className="rs-stats">
        <div className="rs-stats__grid">
          <div className="rs-stat">
            <span className="rs-stat__number">20</span>
            <span className="rs-stat__label">Salas por año</span>
          </div>
          <div className="rs-stat">
            <span className="rs-stat__number">8</span>
            <span className="rs-stat__label">Salas especiales</span>
          </div>
          <div className="rs-stat">
            <span className="rs-stat__number">2</span>
            <span className="rs-stat__label">Décadas de nostalgia</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="rs-features">
        <div className="rs-features__header">
          <span className="rs-features__label">✦ Características</span>
          <h2>Todo lo que necesitas para viajar en el tiempo</h2>
        </div>
        <div className="rs-features__grid">
          {features.map((f, i) => (
            <div
              className="rs-feature-card"
              key={i}
              style={{ '--accent': f.accent } as React.CSSProperties}
            >
              <div className="rs-feature-card__glow" />
              <div className="rs-feature-card__icon">
                <i className={`bi ${f.icon}`} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="rs-feature-card__tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Segunda fila de features ── */}
      <section className="rs-features rs-features--secondary">
        <div className="rs-features__grid">
          {specialFeatures.map((f, i) => (
            <div
              className="rs-feature-card"
              key={i}
              style={{ '--accent': f.accent } as React.CSSProperties}
            >
              <div className="rs-feature-card__glow" />
              <div className="rs-feature-card__icon">
                <i className={`bi ${f.icon}`} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="rs-feature-card__tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Línea de tiempo MEJORADA con scroll ── */}
      <section className="rs-timeline">
        <div className="rs-timeline__inner">
          <span className="rs-timeline__label">
            <i className="bi bi-clock-history" /> Línea de tiempo
          </span>
          <h2>Todos los años del 1990 al 2009</h2>
          <div className="rs-timeline__scroll-wrapper">
            <div className="rs-timeline__bar">
              {allYears.map((year) => (
                <span key={year} className="rs-timeline__year">{year}</span>
              ))}
            </div>
          </div>
          <p className="rs-timeline__desc">
            Cada año tiene su propia sala con una identidad visual única.
            Desliza para explorar toda la línea de tiempo.
          </p>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="rs-cta">
        <div className="rs-cta__inner">
          <h2>¿Listo para el viaje?</h2>
          <p>Únete a la comunidad y revive la mejor época del internet</p>
          <button className="rs-btn rs-btn--cta rs-btn--primary" onClick={() => navigate('/registro')}>
            <i className="bi bi-person-plus" /> Crear cuenta gratis
          </button>
        </div>
      </section>

      <AppFooter />

    </div>
  );
}