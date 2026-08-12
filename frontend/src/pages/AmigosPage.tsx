import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivateMessages } from '../context/PrivateMessagesContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { amigosService, type AmigoItem } from '../services/amigos.service';
import { UserProfileModal } from '../components/UserSearchBar';
import '../styles/amigos.css';

const API = 'http://localhost:3000';

function Avatar({ src, nick }: { src: string | null; nick: string }) {
  if (src) {
    return (
      <div className="am-card__avatar">
        <img src={`${API}${src}`} alt={nick} />
      </div>
    );
  }
  return (
    <div className="am-card__avatar">
      <i className="bi bi-person-fill" />
    </div>
  );
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function AmigosPage() {
  const { isAuthenticated, token } = useAuth();
  const { friends, removeFriend, isUserOnline } = usePrivateMessages();
  const navigate = useNavigate();

  const [amigos, setAmigos] = useState<AmigoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [perfilUsuario, setPerfilUsuario] = useState<AmigoItem['amigo'] | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) { navigate('/login'); return; }
  }, [isAuthenticated, token, navigate]);

  /* ── Cargar amigos y refrescar cuando el estado global de amistad cambia (tiempo real) ── */
  useEffect(() => {
    if (!token) return;
    amigosService.listarAmigos(token)
      .then(setAmigos)
      .catch(() => setError('No se pudo cargar la lista de amigos'))
      .finally(() => setLoading(false));
  }, [token, friends]);

  const setBusyId = (id: number, on: boolean) =>
    setBusy(prev => { const s = new Set(prev); on ? s.add(id) : s.delete(id); return s; });

  const handleEliminar = async (amigoId: number) => {
    setBusyId(amigoId, true);
    try {
      await removeFriend(amigoId);
      setAmigos(prev => prev.filter(a => a.amigo.id !== amigoId));
    } catch { /* silent */ }
    finally { setBusyId(amigoId, false); }
  };

  const handleMensaje = (userId: number) => {
    navigate(`/mensajes?userId=${userId}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="am-page">
      <div className="rs-grid" />
      <AppHeader />

      {/* ── Hero ── */}
      <section className="am-hero">
        <span className="am-hero__badge">✦ Amigos</span>
        <h1 className="am-hero__title">
          Tus <span>amigos</span>
        </h1>
        <p className="am-hero__sub">
          Gestiona tu lista de amistades en RetroChat
        </p>
      </section>

      {/* ── Contenido ── */}
      <main className="am-main">
        {loading && (
          <div className="am-status">
            <i className="bi bi-arrow-repeat rs-spin" />
            <span>Cargando amigos...</span>
          </div>
        )}

        {error && !loading && (
          <div className="am-status am-status--error">
            <i className="bi bi-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          amigos.length === 0 ? (
            <div className="am-status">
              <i className="bi bi-people" />
              <span>Aún no tienes amigos. ¡Busca usuarios y envía solicitudes!</span>
            </div>
          ) : (
            <div className="am-list">
              {amigos.map(a => (
                <div key={a.amistadId} className="am-card">
                  <Avatar src={a.amigo.avatar} nick={a.amigo.nickname} />
                  <div className="am-card__info">
                    <div className="am-card__nick">
                      <span className={`am-status-dot am-status-dot--${isUserOnline(a.amigo.id) ? 'online' : 'offline'}`} />
                      {a.amigo.nickname}
                    </div>
                    <div className="am-card__time">
                      {isUserOnline(a.amigo.id) ? 'En línea' : 'Desconectado'} · Amigos desde {formatFecha(a.desde)}
                    </div>
                  </div>
                  <div className="am-card__actions">
                    <button
                      className="am-btn am-btn--msg"
                      onClick={() => handleMensaje(a.amigo.id)}
                      title="Enviar mensaje"
                    >
                      <i className="bi bi-chat-dots-fill" /> Mensaje
                    </button>
                    <button
                      className="am-btn am-btn--profile"
                      onClick={() => setPerfilUsuario(a.amigo)}
                      title="Ver perfil"
                    >
                      <i className="bi bi-person-lines-fill" /> Perfil
                    </button>
                    <button
                      className="am-btn am-btn--remove"
                      disabled={busy.has(a.amigo.id)}
                      onClick={() => handleEliminar(a.amigo.id)}
                      title="Eliminar amigo"
                    >
                      {busy.has(a.amigo.id)
                        ? <i className="bi bi-arrow-repeat rs-spin" />
                        : <i className="bi bi-person-dash-fill" />
                      } Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      <AppFooter />

      {perfilUsuario && (
        <UserProfileModal
          user={perfilUsuario}
          onClose={() => setPerfilUsuario(null)}
        />
      )}
    </div>
  );
}
