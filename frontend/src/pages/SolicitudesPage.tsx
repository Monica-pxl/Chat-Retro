import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivateMessages } from '../context/PrivateMessagesContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { amigosService, type Solicitud } from '../services/amigos.service';
import '../styles/solicitudes.css';

const API = 'http://localhost:3000';

type Tab = 'recibidas' | 'enviadas';

function Avatar({ src, nick }: { src: string | null; nick: string }) {
  if (src) {
    return (
      <div className="sq-card__avatar">
        <img src={`${API}${src}`} alt={nick} />
      </div>
    );
  }
  return (
    <div className="sq-card__avatar">
      <i className="bi bi-person-fill" />
    </div>
  );
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function SolicitudesPage() {
  const { isAuthenticated, token, user } = useAuth();
  const { subscribeSolicitud, refreshAmistades } = usePrivateMessages();
  const estaSuspendido = user?.estado_cuenta === 'suspendida';
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('recibidas');
  const [recibidas, setRecibidas] = useState<Solicitud[]>([]);
  const [enviadas, setEnviadas] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !token) { navigate('/login'); return; }

    Promise.all([
      amigosService.listarSolicitudesRecibidas(token),
      amigosService.listarSolicitudesEnviadas(token),
    ])
      .then(([rec, env]) => {
        setRecibidas(rec);
        setEnviadas(env);
      })
      .catch(() => setError('No se pudieron cargar las solicitudes'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, navigate]);

  const solicitudHandler = useCallback((tipo: string, data: any) => {
    if (tipo === 'nueva') {
      setRecibidas(prev => {
        if (prev.some(s => s.id === data.id)) return prev;
        return [data, ...prev];
      });
    } else if (tipo === 'aceptada' || tipo === 'rechazada') {
      setEnviadas(prev => prev.filter(s => s.id !== data.id));
    } else if (tipo === 'cancelada') {
      setRecibidas(prev => prev.filter(s => s.id !== data.id));
    }
  }, []);

  useEffect(() => subscribeSolicitud(solicitudHandler), [subscribeSolicitud, solicitudHandler]);

  const setBusyId = (id: number, on: boolean) =>
    setBusy(prev => { const s = new Set(prev); on ? s.add(id) : s.delete(id); return s; });

  const aceptar = async (id: number) => {
    if (!token) return;
    setBusyId(id, true);
    try {
      await amigosService.aceptar(id, token);
      setRecibidas(r => r.filter(s => s.id !== id));
      refreshAmistades();
    } catch { /* silent */ }
    finally { setBusyId(id, false); }
  };

  const rechazar = async (id: number) => {
    if (!token) return;
    setBusyId(id, true);
    try {
      await amigosService.rechazar(id, token);
      setRecibidas(r => r.filter(s => s.id !== id));
      refreshAmistades();
    } catch { /* silent */ }
    finally { setBusyId(id, false); }
  };

  const cancelar = async (id: number) => {
    if (!token) return;
    setBusyId(id, true);
    try {
      await amigosService.cancelar(id, token);
      setEnviadas(e => e.filter(s => s.id !== id));
      refreshAmistades();
    } catch { /* silent */ }
    finally { setBusyId(id, false); }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="sq-page">
      <div className="rs-grid" />
      <AppHeader />

      <section className="sq-hero">
        <span className="sq-hero__badge">✦ Amigos</span>
        <h1 className="sq-hero__title">
          Solicitudes <span>de amistad</span>
        </h1>
        <p className="sq-hero__sub">
          Gestiona las solicitudes que has recibido y las que has enviado
        </p>
      </section>

      <div className="sq-tabs">
        <button
          className={`sq-tab${tab === 'recibidas' ? ' sq-tab--active' : ''}`}
          onClick={() => setTab('recibidas')}
        >
          <i className="bi bi-inbox-fill" />
          <span>Recibidas</span>
          {recibidas.length > 0 && (
            <span className="sq-tab__badge">{recibidas.length}</span>
          )}
        </button>
        <button
          className={`sq-tab${tab === 'enviadas' ? ' sq-tab--active' : ''}`}
          onClick={() => setTab('enviadas')}
        >
          <i className="bi bi-send-fill" />
          <span>Enviadas</span>
          {enviadas.length > 0 && (
            <span className="sq-tab__badge">{enviadas.length}</span>
          )}
        </button>
      </div>

      <main className="sq-main">
        {loading && (
          <div className="sq-status">
            <i className="bi bi-arrow-repeat rs-spin" />
            <span>Cargando solicitudes...</span>
          </div>
        )}

        {error && !loading && (
          <div className="sq-status sq-status--error">
            <i className="bi bi-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && tab === 'recibidas' && (
          <>
            {recibidas.length === 0 ? (
              <div className="sq-status">
                <i className="bi bi-person-check" />
                <span>No tienes solicitudes pendientes</span>
              </div>
            ) : (
              <div className="sq-list">
                {recibidas.map(sol => (
                  <div key={sol.id} className="sq-card">
                    <Avatar src={sol.emisor.avatar} nick={sol.emisor.nickname} />
                    <div className="sq-card__info">
                      <div className="sq-card__nick">
                        <span className="sq-pending-dot" />
                        {sol.emisor.nickname}
                      </div>
                      <div className="sq-card__time">
                        {formatFecha(sol.fecha_creacion)}
                      </div>
                    </div>
                    <div className="sq-card__actions">
                      <button
                        className="sq-btn sq-btn--accept"
                        disabled={busy.has(sol.id)}
                        onClick={() => aceptar(sol.id)}
                      >
                        <i className="bi bi-check-lg" /> <span>Aceptar</span>
                      </button>
                      <button
                        className="sq-btn sq-btn--reject"
                        disabled={busy.has(sol.id)}
                        onClick={() => rechazar(sol.id)}
                      >
                        <i className="bi bi-x-lg" /> <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && tab === 'enviadas' && (
          <>
            {enviadas.length === 0 ? (
              <div className="sq-status">
                <i className="bi bi-send" />
                <span>No has enviado ninguna solicitud pendiente</span>
              </div>
            ) : (
              <div className="sq-list">
                {enviadas.map(sol => (
                  <div key={sol.id} className="sq-card">
                    <Avatar src={sol.receptor.avatar} nick={sol.receptor.nickname} />
                    <div className="sq-card__info">
                      <div className="sq-card__nick">{sol.receptor.nickname}</div>
                      <div className="sq-card__time">
                        Enviada el {formatFecha(sol.fecha_creacion)}
                      </div>
                    </div>
                    <div className="sq-card__actions">
                      <button
                        className="sq-btn sq-btn--cancel"
                        disabled={busy.has(sol.id) || estaSuspendido}
                        onClick={() => cancelar(sol.id)}
                        title={estaSuspendido ? "Cuenta suspendida: no puedes cancelar solicitudes" : undefined}
                      >
                        <i className="bi bi-x-circle" /> <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AppFooter />
    </div>
  );
}