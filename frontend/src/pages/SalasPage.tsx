import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { salasService, type Sala } from '../services/salas.service';
import '../styles/salas.css';

type Filtro = 'todas' | 'anuales' | 'especiales';

function getAccent(sala: Sala): string {
  if (sala.tipo === 'epoca_estilo') return 'var(--accent-orange)';
  const year = sala.ano ?? 1990;
  if (year < 1995) return 'var(--accent-green)';
  if (year < 2000) return 'var(--accent-cyan)';
  if (year < 2005) return 'var(--accent-pink)';
  return 'var(--accent-purple)';
}

export default function SalasPage() {
  const [salas, setSalas]         = useState<Sala[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filtro, setFiltro]       = useState<Filtro>('todas');
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    salasService
      .getSalas()
      .then(setSalas)
      .catch(() => setError('No se pudieron cargar las salas'))
      .finally(() => setLoading(false));
  }, []);

  const salasFiltradas = salas.filter(s => {
    if (filtro === 'anuales')    return s.tipo === 'general_anual';
    if (filtro === 'especiales') return s.tipo === 'epoca_estilo';
    return true;
  });

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rs-salas-page">
      <div className="rs-grid" />

      <AppHeader />

      {/* ── Hero ── */}
      <section className="rs-salas-hero">
        <div className="rs-salas-hero__inner">
          <span className="rs-hero__badge">✦ En tiempo real</span>
          <h1 className="rs-salas-hero__title">Salas de Chat</h1>
          <p className="rs-salas-hero__sub">
            Explora todas las salas y únete a la conversación — sin necesidad de registrarte
          </p>
        </div>
      </section>

      {/* ── Filtros ── */}
      <div className="rs-salas-filters">
        {(['todas', 'anuales', 'especiales'] as Filtro[]).map(f => (
          <button
            key={f}
            className={`rs-salas-filter-btn${filtro === f ? ' rs-salas-filter-btn--active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'todas'      && <><i className="bi bi-grid-3x3-gap" /> Todas</>}
            {f === 'anuales'    && <><i className="bi bi-calendar3" /> Por año</>}
            {f === 'especiales' && <><i className="bi bi-stars" /> Especiales</>}
          </button>
        ))}
        <span className="rs-salas-filter-count">{salasFiltradas.length} salas</span>
      </div>

      {/* ── Grid ── */}
      <main className="rs-salas-main">
        {loading && (
          <div className="rs-salas-status">
            <i className="bi bi-arrow-repeat rs-spin rs-salas-status__icon" />
            <span>Cargando salas...</span>
          </div>
        )}

        {error && !loading && (
          <div className="rs-salas-status rs-salas-status--error">
            <i className="bi bi-exclamation-circle rs-salas-status__icon" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && salasFiltradas.length === 0 && (
          <div className="rs-salas-status">
            <i className="bi bi-inbox rs-salas-status__icon" />
            <span>No hay salas en esta categoría</span>
          </div>
        )}

        {!loading && !error && (
          <div className="rs-salas-grid">
            {salasFiltradas.map(sala => (
              <div
                key={sala.id}
                className={`rs-sala-card${sala.cerrada ? ' rs-sala-card--cerrada' : ''}`}
                style={{ '--sala-accent': getAccent(sala) } as React.CSSProperties}
              >
                <div className="rs-sala-card__glow" />

                <div className="rs-sala-card__head">
                  <span className={`rs-sala-badge${sala.cerrada ? ' rs-sala-badge--closed' : ' rs-sala-badge--live'}`}>
                    <i className={`bi ${sala.cerrada ? 'bi-lock-fill' : 'bi-circle-fill'}`} />
                    {sala.cerrada ? 'Cerrada' : 'En vivo'}
                  </span>

                  {sala.tipo === 'general_anual' && sala.ano && (
                    <span className="rs-sala-card__era">{sala.ano}</span>
                  )}
                  {sala.tipo === 'epoca_estilo' && sala.epoca && (
                    <span className="rs-sala-card__era">{sala.epoca.nombre}</span>
                  )}
                </div>

                <div className="rs-sala-card__body">
                  <h3 className="rs-sala-card__name">{sala.nombre}</h3>
                  {sala.tematica && (
                    <span className="rs-sala-card__tag">
                      <i className="bi bi-tag" /> {sala.tematica.nombre}
                    </span>
                  )}
                  {sala.descripcion && (
                    <>
                      <p className={`rs-sala-card__desc${expanded.has(sala.id) ? ' rs-sala-card__desc--expanded' : ''}`}>
                        {sala.descripcion}
                      </p>
                      {sala.descripcion.length > 80 && (
                        <button
                          className="rs-sala-card__ver-mas"
                          onClick={e => toggleExpand(sala.id, e)}
                        >
                          {expanded.has(sala.id)
                            ? <><i className="bi bi-chevron-up" /> Ver menos</>
                            : <><i className="bi bi-chevron-down" /> Ver descripción</>
                          }
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="rs-sala-card__footer">
                  <button
                    className="rs-sala-enter-btn"
                    onClick={() => navigate(`/salas/${sala.id}`)}
                    disabled={sala.cerrada}
                  >
                    {sala.cerrada
                      ? <><i className="bi bi-lock" /> No disponible</>
                      : <><i className="bi bi-door-open" /> Entrar a la sala</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
