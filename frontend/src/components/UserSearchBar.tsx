import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivateMessages } from '../context/PrivateMessagesContext';
import { userService, type UserSearch } from '../services/user.service';
import '../styles/search.css';

const API = 'http://localhost:3000';

// 🔥 Esta interfaz define que el modal acepta CUALQUIER usuario que tenga estos campos
interface ModalUser {
  id: number;
  nickname: string;
  avatar: string | null;
  estado: string;
  estado_cuenta: string;
}

/* ── Modal de perfil de usuario ── */
export function UserProfileModal({
  user,
  onClose,
}: {
  user: ModalUser;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { getFriendStatus, isUserOnline, sendFriendRequest, cancelFriendRequest, acceptFriendRequest } = usePrivateMessages();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; err: boolean } | null>(null);
  const estado = getFriendStatus(user.id);
  const enLinea = isUserOnline(user.id);

  // 🔥 DETECTAMOS SI EL USUARIO DEL PERFIL ESTÁ SUSPENDIDO
  const estaSuspendido = user.estado_cuenta === 'suspendida';

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleMensaje = () => {
    onClose();
    navigate(`/mensajes?userId=${user.id}`);
  };

  const handleAddFriend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await sendFriendRequest(user.id);
      setFeedback({ text: '¡Solicitud enviada!', err: false });
    } catch (err: any) {
      setFeedback({ text: err.response?.data?.error || 'Error al enviar solicitud', err: true });
    } finally {
      setBusy(false);
    }
  };

  const handleCancelFriend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await cancelFriendRequest(user.id);
      setFeedback({ text: 'Solicitud cancelada', err: false });
    } catch (err: any) {
      setFeedback({ text: err.response?.data?.error || 'Error al cancelar solicitud', err: true });
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await acceptFriendRequest(user.id);
      setFeedback({ text: '¡Ahora sois amigos!', err: false });
    } catch (err: any) {
      setFeedback({ text: err.response?.data?.error || 'Error al aceptar solicitud', err: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rs-modal-overlay" onClick={onClose}>
      <div className="rs-modal-card" onClick={e => e.stopPropagation()}>
        <button className="rs-modal-close" onClick={onClose} title="Cerrar">
          <i className="bi bi-x-lg" />
        </button>

        {/* Avatar */}
        <div className="rs-modal-avatar">
          {user.avatar
            ? <img src={`${API}${user.avatar}`} alt={user.nickname} />
            : <i className="bi bi-person-fill" />
          }
        </div>

        {/* Nombre */}
        <div className="rs-modal-nick">{user.nickname}</div>

        {/* Estado */}
        <div className="rs-modal-status">
          <span className={`rs-modal-status__dot rs-modal-status__dot--${enLinea ? 'online' : 'offline'}`} />
          {enLinea ? 'En línea' : 'Desconectado'}
        </div>

        {/* Acciones */}
        <div className="rs-modal-actions">
          
          {/* 🔥 MENSAJE: Deshabilitado si está suspendido */}
          <button 
            className="rs-modal-btn rs-modal-btn--msg" 
            onClick={handleMensaje}
            disabled={estaSuspendido}
          >
            <i className="bi bi-chat-dots-fill" /> Mensaje
          </button>

          {estado === 'amigo' && (
            <button className="rs-modal-btn rs-modal-btn--add sent" disabled>
              <i className="bi bi-people-fill" /> Ya sois amigos
            </button>
          )}

          {estado === 'enviada' && (
            <button
              className="rs-modal-btn rs-modal-btn--add"
              onClick={handleCancelFriend}
              disabled={busy}
            >
              {busy
                ? <><i className="bi bi-arrow-repeat rs-spin" /> Cancelando…</>
                : <><i className="bi bi-x-circle" /> Cancelar solicitud</>
              }
            </button>
          )}

          {estado === 'recibida' && (
            <button
              className="rs-modal-btn rs-modal-btn--add"
              onClick={handleAcceptFriend}
              disabled={busy}
            >
              {busy
                ? <><i className="bi bi-arrow-repeat rs-spin" /> Aceptando…</>
                : <><i className="bi bi-check-lg" /> Aceptar solicitud</>
              }
            </button>
          )}

          {estado === 'ninguno' && (
            <button
              className="rs-modal-btn rs-modal-btn--add"
              onClick={handleAddFriend}
              disabled={busy || estaSuspendido}
            >
              {busy
                ? <><i className="bi bi-arrow-repeat rs-spin" /> Enviando…</>
                : <><i className="bi bi-person-plus-fill" /> Añadir</>
              }
            </button>
          )}
        </div>

        {feedback && (
          <div className={`rs-modal-feedback rs-modal-feedback--${feedback.err ? 'err' : 'ok'}`}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Barra de búsqueda ── */
export default function UserSearchBar() {
  const { token } = useAuth();
  const { isUserOnline } = usePrivateMessages();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearch | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim() || val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await userService.searchUsers(val.trim(), token);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleSelect = (u: UserSearch) => {
    setSelectedUser(u);
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      <div className="rs-search-wrap" ref={wrapRef}>
        <div className="rs-search-box">
          <i className="bi bi-search rs-search-icon" />
          <input
            ref={inputRef}
            className="rs-search-input"
            type="text"
            placeholder="Buscar usuario…"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            autoComplete="off"
          />
          {loading && <i className="bi bi-arrow-repeat rs-spin rs-search-icon" />}
          {query && !loading && (
            <button className="rs-search-clear" onClick={handleClear} title="Limpiar">
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>

        {open && (
          <div className="rs-search-dropdown">
            {results.length === 0 ? (
              <div className="rs-search-empty">Sin resultados para "{query}"</div>
            ) : (
              results.map(u => (
                <div
                  key={u.id}
                  className="rs-search-result"
                  onClick={() => handleSelect(u)}
                >
                  <div className="rs-search-result__avatar">
                    {u.avatar
                      ? <img src={`${API}${u.avatar}`} alt={u.nickname} />
                      : <i className="bi bi-person-fill" />
                    }
                  </div>
                  <div className="rs-search-result__info">
                    <div className="rs-search-result__nick">{u.nickname}</div>
                    <div className="rs-search-result__status">
                      <span className={`rs-search-result__dot rs-search-result__dot--${isUserOnline(u.id) ? 'online' : 'offline'}`} />
                      {isUserOnline(u.id) ? 'En línea' : 'Desconectado'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}