import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import { salasService, type Sala, type MensajePrivadoAPI } from '../services/salas.service';
import '../styles/salas.css';
import { uploadService } from "../services/upload.service";

interface MensajeUI {
  userId?: number;
  nickname: string;
  avatar: string | null;
  contenido: string;
  tipo?: 'texto' | 'imagen' | 'gif' | 'audio';
  fecha: string;
}

interface UsuarioSala {
  id: number;
  nickname: string;
  avatar: string | null;
}

interface MensajePrivadoUI {
  id: number;
  emisorId: number;
  emisorNickname: string;
  contenido: string;
  fecha: string;
  tipo?: 'texto' | 'imagen' | 'gif' | 'audio';
}

const API = 'http://localhost:3000';

function getIconoPorAnio(ano: number): string {
  const iconos: Record<number, string> = {
    1990: 'bi-file-earmark-text',
    1991: 'bi-building',
    1992: 'bi-emoji-smile',
    1993: 'bi-candle',
    1994: 'bi-tv',
    1995: 'bi-star-fill',
    1996: 'bi-guitar',
    1997: 'bi-cup-straw',
    1998: 'bi-code-square',
    1999: 'bi-star-fill',
    2000: 'bi-heart-fill',
    2001: 'bi-hand-index-thumb',
    2002: 'bi-gem',
    2003: 'bi-heart-fill',
    2004: 'bi-chat-dots-fill',
    2005: 'bi-ribbon',
    2006: 'bi-rainbow',
    2007: 'bi-droplet-fill',
    2008: 'bi-headphones',
    2009: 'bi-cpu',
  };
  return iconos[ano] || 'bi-stars';
}

type FiltroNavegador = '90s' | '2000s' | 'tematicas90s' | 'tematicas2000s';

export default function SalaPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, token, user } = useAuth();
  const navigate = useNavigate();

  const [sala, setSala] = useState<Sala | null>(null);
  const [mensajes, setMensajes] = useState<MensajeUI[]>([]);
  const [texto, setTexto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [usuarios, setUsuarios] = useState<UsuarioSala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [musicOn, setMusicOn] = useState(true);
  const [salasList, setSalasList] = useState<Sala[]>([]);
  const [filtroNavegador, setFiltroNavegador] = useState<FiltroNavegador>('90s');

  // 🔥 CHAT PRIVADO
  const [chatPrivadoAbierto, setChatPrivadoAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioSala | null>(null);
  const [mensajesPrivados, setMensajesPrivados] = useState<MensajePrivadoUI[]>([]);
  const [textoPrivado, setTextoPrivado] = useState('');
  const [mensajesPendientes, setMensajesPendientes] = useState<Set<number>>(new Set());
  const usuarioSeleccionadoRef = useRef<UsuarioSala | null>(null);
  const fileInputPrivadoRef = useRef<HTMLInputElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const privadoMessagesEnd = useRef<HTMLDivElement>(null);

  const salaId = Number(id);

  const esTvShow = sala?.tematica?.nombre?.toLowerCase().includes('tv shows') || false;

  /* ── Cargar info ── */
  useEffect(() => {
    const requests: Promise<unknown>[] = [
      salasService.getSalaById(salaId),
      salasService.getMensajes(salaId, token ?? undefined),
      salasService.getSalas(),
    ];

    if (!isAuthenticated) {
      requests.push(salasService.getOnlineCount(salaId));
    }

    Promise.all(requests)
      .then(([salaData, mensajesData, salasData, countData]) => {
        setSala(salaData as Sala);
        setSalasList(salasData as Sala[]);
        setMensajes(
          (mensajesData as any[]).map(m => ({
            userId: m.userId,
            nickname: m.user.nickname,
            avatar: m.user.avatar,
            contenido: m.contenido,
            tipo: m.tipo || 'texto',
            fecha: m.fecha_creacion,
          }))
        );
        if (!isAuthenticated && countData) {
          setUserCount((countData as { count: number }).count);
        }
      })
      .catch(() => setError('No se pudo cargar la sala'))
      .finally(() => setLoading(false));
  }, [salaId, token, isAuthenticated]);

  /* ── Sincronizar filtro ── */
  useEffect(() => {
    if (!sala) return;
    let nuevoFiltro: FiltroNavegador = '90s';
    if (sala.tipo === 'general_anual' && sala.ano) {
      if (sala.ano >= 2000 && sala.ano <= 2009) nuevoFiltro = '2000s';
      else if (sala.ano >= 1990 && sala.ano <= 1999) nuevoFiltro = '90s';
    } else if (sala.tipo === 'epoca_estilo' && sala.epoca) {
      const epocaId = sala.epoca.id;
      if (epocaId === 2) nuevoFiltro = 'tematicas2000s';
      else if (epocaId === 1) nuevoFiltro = 'tematicas90s';
    }
    setFiltroNavegador(nuevoFiltro);
  }, [sala]);

  /* ── Socket ── */
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io('http://localhost:3000', { auth: { token }, forceNew: true });
    socketRef.current = socket;

    socket.on('receive-message', (msg: { user: { nickname: string; avatar: string | null }; contenido: string; tipo: string; fecha: string }) => {
      setMensajes(prev => [...prev, {
        nickname: msg.user.nickname,
        avatar: msg.user.avatar,
        contenido: msg.contenido,
        tipo: msg.tipo as 'texto' | 'imagen' | 'gif' | 'audio',
        fecha: msg.fecha
      }]);
    });

    socket.on('room-user-count', ({ count }: { count: number }) => {
      setUserCount(count);
    });

    socket.on('room-error', ({ message }: { message: string }) => {
      setRoomError(message);
    });

    socket.on('room-users', ({ users }: { users: UsuarioSala[] }) => {
      setUsuarios(users);
    });

    // 🔥 Escuchar mensajes privados
    socket.on('receive-private-message', (msg: { 
      chatId: number; 
      user: { id: number; nickname: string; avatar: string | null };
      destinatarioId: number;
      contenido: string;
      tipo?: string;
      fecha: string 
    }) => {
      // El "partner" de este usuario en la conversación:
      // - Si soy el emisor (msg.user.id === mi id), el partner es el destinatario
      // - Si soy el receptor, el partner es el emisor (msg.user.id)
      const soyEmisor = msg.user.id === user?.id;
      const partnerId = soyEmisor ? msg.destinatarioId : msg.user.id;

      const chatAbierto = usuarioSeleccionadoRef.current?.id === partnerId;

      if (chatAbierto) {
        setMensajesPrivados(prev => [...prev, {
          id: Date.now(),
          emisorId: msg.user.id,
          emisorNickname: msg.user.nickname,
          contenido: msg.contenido,
          fecha: msg.fecha,
          tipo: (msg.tipo as any) || 'texto'
        }]);
      } else if (!soyEmisor) {
        // Solo notificar pendiente al receptor, nunca al propio emisor
        setMensajesPendientes(prev => new Set(prev).add(partnerId));
      }
    });

    socket.on('connect', () => {
      socket.emit('join-room', salaId);
    });

    return () => {
      socket.emit('leave-room', salaId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [salaId, isAuthenticated, token]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  useEffect(() => {
    privadoMessagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesPrivados]);

  /* ── Enviar mensaje sala ── */
  const sendMessage = () => {
    const trimmed = texto.trim();
    if (!trimmed || !socketRef.current) return;
    socketRef.current.emit('send-message', {
      roomId: salaId,
      contenido: trimmed,
      tipo: 'texto'
    });
    setTexto('');
    textareaRef.current?.focus();
  };

  /* ── Subir imagen ── */
  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (!socketRef.current) return;
    if (!token) return;

    const file = e.target.files[0];
    try {
      setSubiendo(true);
      const res = await uploadService.uploadImage(file, token);
      socketRef.current.emit("send-message", {
        roomId: salaId,
        contenido: res.url,
        tipo: "imagen",
      });
    } catch {
      alert("No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  };

  /* ── Enviar mensaje privado ── */
  const sendPrivateMessage = () => {
    const trimmed = textoPrivado.trim();
    if (!trimmed || !socketRef.current || !usuarioSeleccionado) return;
    
    socketRef.current.emit('private-message', {
      destinatarioId: usuarioSeleccionado.id,
      contenido: trimmed,
      tipo: 'texto'
    });
    
    setTextoPrivado('');
  };

  /* ── Subir imagen en privado ── */
  const subirImagenPrivada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !socketRef.current || !usuarioSeleccionado || !token) return;
    const file = e.target.files[0];
    try {
      setSubiendo(true);
      const res = await uploadService.uploadImage(file, token);
      socketRef.current.emit('private-message', {
        destinatarioId: usuarioSeleccionado.id,
        contenido: res.url,
        tipo: 'imagen'
      });
    } catch {
      alert('No se pudo subir la imagen');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePrivateKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrivateMessage();
    }
  };

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (fecha.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
    if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;

    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleMusic = () => {
    setMusicOn(!musicOn);
  };

  /* ── Sync ref para el handler del socket ── */
  useEffect(() => {
    usuarioSeleccionadoRef.current = usuarioSeleccionado;
  }, [usuarioSeleccionado]);

  /* ── Abrir chat privado ── */
  const abrirChatPrivado = async (usuario: UsuarioSala) => {
    if (usuario.id === user?.id) {
      alert('No puedes chatear contigo mismo');
      return;
    }
    // Actualizar ref inmediatamente para que el socket handler no pierda mensajes
    usuarioSeleccionadoRef.current = usuario;
    setUsuarioSeleccionado(usuario);
    setChatPrivadoAbierto(true);
    setMensajesPrivados([]);
    setMensajesPendientes(prev => {
      const next = new Set(prev);
      next.delete(usuario.id);
      return next;
    });

    // Cargar historial
    if (token) {
      try {
        const chat = await salasService.getChatPrivado(usuario.id, token);
        const historial = chat.mensajes.map((m: MensajePrivadoAPI) => ({
          id: m.id,
          emisorId: m.emisorId,
          emisorNickname: m.emisor.nickname,
          contenido: m.contenido,
          fecha: m.fecha_creacion,
          tipo: (m.tipo as any) || 'texto',
        }));
        // Fusionar historial con mensajes en tiempo real que pudieran haber llegado
        // durante la carga (evitar duplicados por id)
        setMensajesPrivados(prev => {
          const ids = new Set(historial.map((m: MensajePrivadoUI) => m.id));
          const soloNuevos = prev.filter(m => !ids.has(m.id));
          return [...historial, ...soloNuevos];
        });
      } catch (err) {
        console.error('Error cargando historial privado:', err);
      }
    }
  };

  const cerrarChatPrivado = () => {
    setChatPrivadoAbierto(false);
    setUsuarioSeleccionado(null);
    setMensajesPrivados([]);
  };

  const salasFiltradas = salasList.filter(s => {
    if (s.id === salaId) return false;
    switch (filtroNavegador) {
      case '90s':
        return s.tipo === 'general_anual' && s.ano && s.ano >= 1990 && s.ano <= 1999;
      case '2000s':
        return s.tipo === 'general_anual' && s.ano && s.ano >= 2000 && s.ano <= 2009;
      case 'tematicas90s':
        return s.tipo === 'epoca_estilo' && s.epoca?.id === 1;
      case 'tematicas2000s':
        return s.tipo === 'epoca_estilo' && s.epoca?.id === 2;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="rs-sala-page rs-sala-page--loading">
        <div className="rs-grid" />
        <AppHeader />
        <div className="rs-sala-center-msg">
          <i className="bi bi-arrow-repeat rs-spin" />
          <span>Cargando sala...</span>
        </div>
      </div>
    );
  }

  if (error || !sala) {
    return (
      <div className="rs-sala-page rs-sala-page--loading">
        <div className="rs-grid" />
        <AppHeader />
        <div className="rs-sala-center-msg rs-sala-center-msg--error">
          <i className="bi bi-exclamation-circle" />
          <p>{error || 'Sala no encontrada'}</p>
          <button className="rs-btn rs-btn--primary" onClick={() => navigate('/salas')}>
            <i className="bi bi-arrow-left" /> Volver a salas
          </button>
        </div>
      </div>
    );
  }

  let temaCalculado = 'especial';
  let textoBarra = '';
  let esTematica = false;

  if (sala.tipo === 'epoca_estilo' && sala.epoca && sala.tematica) {
    esTematica = true;
    let epoca = sala.epoca.nombre?.toLowerCase().replace(/\s/g, '_') || '';
    const tematica = sala.tematica.nombre?.toLowerCase().replace(/\s/g, '_') || '';
    if (epoca === '1990-1999') epoca = '90s';
    if (epoca === '2000-2009') epoca = '2000s';
    temaCalculado = `${epoca}_${tematica}`;
    if (sala.epoca.nombre === '1990-1999') textoBarra = '1990s';
    else if (sala.epoca.nombre === '2000-2009') textoBarra = '2000s';
    else textoBarra = sala.epoca.nombre || '';
  } else if (sala.ano) {
    esTematica = false;
    temaCalculado = sala.ano.toString();
    textoBarra = sala.ano.toString();
  }

  return (
    <div className="rs-sala-page" data-tema={temaCalculado}>
      
      <div className="rs-grid" />
      <AppHeader />

      <div className="rs-sala-topbar">
        <button className="rs-sala-back" onClick={() => navigate('/salas')}>
          <i className="bi bi-arrow-left" />
          <span>Salas</span>
        </button>

        <div className="rs-sala-topbar__info">
          <h2 className="rs-sala-topbar__name">{sala.nombre}</h2>
          <div className="rs-sala-topbar__meta">
            {sala.tipo === 'general_anual' && sala.ano && (
              <span className="rs-sala-topbar__badge">{sala.ano}</span>
            )}
            {sala.tipo === 'epoca_estilo' && sala.epoca && (
              <span className="rs-sala-topbar__badge">{textoBarra}</span>
            )}
            {sala.tematica && (
              <span className="rs-sala-topbar__badge rs-sala-topbar__badge--sub">
                <i className="bi bi-tag" /> {sala.tematica.nombre}
              </span>
            )}
            {sala.descripcion && (
              <span className="rs-sala-topbar__desc">{sala.descripcion}</span>
            )}
          </div>
        </div>

        <button
          className={`rs-sala-music-btn ${musicOn ? 'rs-sala-music-btn--active' : ''}`}
          onClick={toggleMusic}
          title={musicOn ? 'Silenciar música' : 'Activar música'}
        >
          <i className={`bi ${musicOn ? 'bi-music-note-beamed' : 'bi-music-note'}`} />
        </button>

        <div className="rs-sala-topbar__users">
          <i className="bi bi-people-fill" />
          <span className="rs-sala-topbar__user-count">{userCount}</span>
          <span className="rs-sala-topbar__user-label">en sala</span>
        </div>
      </div>

      <div className="rs-sala-layout">

        {/* ── Columna 1: Usuarios (izquierda) ── */}
        <div className="rs-sala-users">
          <div className="rs-sala-users__header">
            <i className="bi bi-people" />
            <span>{userCount} usuarios</span>
          </div>
          <div className="rs-sala-users__list">
            {usuarios.length === 0 ? (
              <div className="rs-sala-users__empty">
                <span>Cargando usuarios...</span>
              </div>
            ) : (
              usuarios.map((u) => {
                const esYo = isAuthenticated && user?.id === u.id;
                return (
                  <div 
                    key={u.id} 
                    className={`rs-sala-users__item ${esYo ? 'rs-sala-users__item--yo' : 'rs-sala-users__item--clickable'}${mensajesPendientes.has(u.id) ? ' rs-sala-users__item--pendiente' : ''}`}
                    onClick={!esYo ? () => abrirChatPrivado(u) : undefined}
                    title={esYo ? 'Eres tú' : `Chatear con ${u.nickname}`}
                  >
                    <div className="rs-sala-users__avatar">
                      {u.avatar ? (
                        <img src={`${API}${u.avatar}`} alt={u.nickname} />
                      ) : (
                        u.nickname.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="rs-sala-users__name">{u.nickname}</span>
                    {esYo ? (
                      <span className="rs-sala-users__yo-badge">(tú)</span>
                    ) : mensajesPendientes.has(u.id) ? (
                      <span className="rs-sala-users__msg-badge" title="Mensaje no leído">!</span>
                    ) : (
                      <span className="rs-sala-users__dot" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Columna 2: Chat privado (si está abierto) ── */}
        {chatPrivadoAbierto && usuarioSeleccionado && (
          <div className="rs-sala-chat-privado">
            <div className="rs-sala-chat-privado__header">
              <div className="rs-sala-chat-privado__user">
                <div className="rs-sala-chat-privado__avatar">
                  {usuarioSeleccionado.avatar ? (
                    <img src={`${API}${usuarioSeleccionado.avatar}`} alt={usuarioSeleccionado.nickname} />
                  ) : (
                    usuarioSeleccionado.nickname.charAt(0).toUpperCase()
                  )}
                </div>
                <span>{usuarioSeleccionado.nickname}</span>
              </div>
              <button 
                className="rs-sala-chat-privado__close"
                onClick={cerrarChatPrivado}
                title="Cerrar chat privado"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="rs-sala-chat-privado__messages">
              {mensajesPrivados.length === 0 ? (
                <div className="rs-sala-chat-privado__empty">
                  <i className="bi bi-chat-dots" />
                  <span>No hay mensajes aún</span>
                  <small>Envía un mensaje a {usuarioSeleccionado.nickname}</small>
                </div>
              ) : (
                mensajesPrivados.map((msg, idx) => {
                  const isOwn = msg.emisorId === user?.id;
                  return (
                    <div
                      key={idx}
                      className={`rs-msg-privado ${isOwn ? 'rs-msg-privado--own' : 'rs-msg-privado--other'}`}
                    >
                      <div className="rs-msg-privado__bubble">
                        {msg.tipo === 'imagen' ? (
                          <img
                            src={`${API}${msg.contenido}`}
                            alt="Imagen"
                            className="rs-msg__image"
                            style={{ maxWidth: '100%', borderRadius: '6px' }}
                          />
                        ) : (
                          msg.contenido
                        )}
                      </div>
                      <span className="rs-msg-privado__time">{formatFecha(msg.fecha)}</span>
                    </div>
                  );
                })
              )}
              <div ref={privadoMessagesEnd} />
            </div>

            <div className="rs-sala-chat-privado__input">
              <button
                className="rs-sala-attach-btn"
                title="Subir imagen"
                onClick={() => fileInputPrivadoRef.current?.click()}
                disabled={subiendo}
              >
                <i className="bi bi-paperclip" />
              </button>
              <input
                ref={fileInputPrivadoRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={subirImagenPrivada}
              />
              <textarea
                className="rs-sala-chat-privado__textarea"
                placeholder={`Mensaje para ${usuarioSeleccionado.nickname}...`}
                value={textoPrivado}
                onChange={e => setTextoPrivado(e.target.value)}
                onKeyDown={handlePrivateKeyDown}
                rows={1}
                maxLength={500}
              />
              <button
                className="rs-sala-chat-privado__send"
                onClick={sendPrivateMessage}
                disabled={!textoPrivado.trim()}
                title="Enviar"
              >
                <i className="bi bi-send-fill" />
              </button>
            </div>
          </div>
        )}

        {/* ── Columna 3: Chat de la sala ── */}
        <div className={`rs-sala-chat ${chatPrivadoAbierto ? 'rs-sala-chat--with-private' : ''}`}>

          {!esTvShow && (
            <div className={`rs-sala-year ${esTematica ? 'rs-sala-year--tematica' : ''}`}>
              <span className="rs-sala-year__number">{textoBarra}</span>
              {!esTematica && sala.ano && (
                <span className="rs-sala-year__icon">
                  <i className={`bi ${getIconoPorAnio(sala.ano)}`} />
                </span>
              )}
            </div>
          )}

          {esTvShow && (
            <div className="rs-sala-tv">
              <div className="rs-sala-tv__screen">
                <div className="rs-sala-tv__content">
                  <i className="bi bi-tv rs-sala-tv__icon" />
                  <span className="rs-sala-tv__label">Emisión en vivo</span>
                  <span className="rs-sala-tv__sub">Programación nostálgica de los {sala.ano || '90/2000'}</span>
                  <div className="rs-sala-tv__scanlines" />
                </div>
              </div>
              <div className="rs-sala-tv__info">
                <span className="rs-sala-tv__badge">
                  <i className="bi bi-broadcast" /> En directo
                </span>
                <span className="rs-sala-tv__time">
                  <i className="bi bi-clock" /> {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}

          <div className={`rs-sala-messages ${esTvShow ? 'rs-sala-messages--with-tv' : ''}`}>
            {mensajes.length === 0 ? (
              <div className="rs-sala-empty">
                <i className="bi bi-chat-dots rs-sala-empty__icon" />
                <p>Aún no hay mensajes en esta sala</p>
                <span>¡Sé el primero en escribir!</span>
              </div>
            ) : (
              mensajes.map((msg, idx) => {
                const isOwn = isAuthenticated && user?.nickname === msg.nickname;
                return (
                  <div
                    key={idx}
                    className={`rs-msg${isOwn ? ' rs-msg--own' : ' rs-msg--other'}`}
                  >
                    <div className="rs-msg__avatar" title={msg.nickname}>
                      {msg.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="rs-msg__content">
                      <div className="rs-msg__header">
                        <span className="rs-msg__nick">{msg.nickname}</span>
                      </div>
                      <div className="rs-msg__bubble">
                        {msg.tipo === "imagen" ? (
                          <img
                            src={`${API}${msg.contenido}`}
                            alt="Imagen"
                            className="rs-msg__image"
                          />
                        ) : (
                          msg.contenido
                        )}
                      </div>
                      <span className="rs-msg__time">{formatFecha(msg.fecha)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEnd} />
          </div>

          {isAuthenticated ? (
            <div className="rs-sala-input-area">
              {roomError && (
                <div className="rs-sala-room-err">
                  <i className="bi bi-exclamation-circle" /> {roomError}
                </div>
              )}
              <div className="rs-sala-input-row">
                <button
                  className="rs-sala-attach-btn"
                  title="Subir imagen"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendo}
                >
                  <i className="bi bi-paperclip" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={subirImagen}
                />
                <textarea
                  ref={textareaRef}
                  className="rs-sala-input"
                  placeholder="Escribe un mensaje..."
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={1000}
                />
                <button
                  className="rs-sala-send-btn"
                  onClick={sendMessage}
                  disabled={!texto.trim()}
                  title="Enviar (Enter)"
                >
                  <i className="bi bi-send-fill" />
                </button>
              </div>
              <p className="rs-sala-input-hint">
                <kbd>Enter</kbd> para enviar &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> para nueva línea
              </p>
            </div>
          ) : (
            <div className="rs-sala-auth-banner">
              <i className="bi bi-lock rs-sala-auth-banner__icon" />
              <div className="rs-sala-auth-banner__text">
                <strong>Solo estás leyendo</strong>
                <span>Inicia sesión para participar en la conversación</span>
              </div>
              <Link to="/login" className="rs-btn rs-btn--primary rs-sala-auth-banner__cta">
                <i className="bi bi-box-arrow-in-right" /> Iniciar sesión
              </Link>
            </div>
          )}
        </div>

        {/* ── Columna 4: Navegador de salas (derecha) ── */}
        <div className="rs-sala-navegador">
          <div className="rs-sala-navegador__header">
            <i className="bi bi-grid-3x3-gap-fill" />
            <span>Cambiar sala</span>
          </div>

          <div className="rs-sala-navegador__filtros">
            <button
              className={`rs-sala-navegador__filtro ${filtroNavegador === '90s' ? 'rs-sala-navegador__filtro--active' : ''}`}
              onClick={() => setFiltroNavegador('90s')}
            >
              <i className="bi bi-calendar3" /> 90s
            </button>
            <button
              className={`rs-sala-navegador__filtro ${filtroNavegador === '2000s' ? 'rs-sala-navegador__filtro--active' : ''}`}
              onClick={() => setFiltroNavegador('2000s')}
            >
              <i className="bi bi-calendar3" /> 2000s
            </button>
            <button
              className={`rs-sala-navegador__filtro ${filtroNavegador === 'tematicas90s' ? 'rs-sala-navegador__filtro--active' : ''}`}
              onClick={() => setFiltroNavegador('tematicas90s')}
            >
              <i className="bi bi-stars" /> Temáticas 90s
            </button>
            <button
              className={`rs-sala-navegador__filtro ${filtroNavegador === 'tematicas2000s' ? 'rs-sala-navegador__filtro--active' : ''}`}
              onClick={() => setFiltroNavegador('tematicas2000s')}
            >
              <i className="bi bi-stars" /> Temáticas 2000s
            </button>
          </div>

          <div className="rs-sala-navegador__list">
            {salasFiltradas.length === 0 ? (
              <div className="rs-sala-navegador__empty">
                <span>No hay salas en esta categoría</span>
              </div>
            ) : (
              salasFiltradas.map((s) => (
                <button
                  key={s.id}
                  className={`rs-sala-navegador__item${s.cerrada ? ' rs-sala-navegador__item--cerrada' : ''}`}
                  onClick={() => navigate(`/salas/${s.id}`)}
                  disabled={s.cerrada}
                  title={s.cerrada ? 'Sala cerrada' : s.descripcion || s.nombre}
                >
                  <div className="rs-sala-navegador__fila">
                    <span className="rs-sala-navegador__nombre">{s.nombre}</span>
                    <span className={`rs-sala-navegador__estado ${s.cerrada ? 'rs-sala-navegador__estado--cerrada' : 'rs-sala-navegador__estado--abierta'}`}>
                      <i className={`bi ${s.cerrada ? 'bi-lock-fill' : 'bi-circle-fill'}`} />
                    </span>
                  </div>
                  <div className="rs-sala-navegador__sub">
                    {s.ano && <span className="rs-sala-navegador__ano">{s.ano}</span>}
                    {s.tematica && <span className="rs-sala-navegador__tag">{s.tematica.nombre}</span>}
                    {s.cerrada && <span className="rs-sala-navegador__cerrada">Cerrada</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}