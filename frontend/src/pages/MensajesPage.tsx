import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivateMessages, type IncomingPrivateMsg } from '../context/PrivateMessagesContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { chatsService, type ChatResumen, type MensajePrivado } from '../services/amigos.service';
import { uploadService } from '../services/upload.service';
import '../styles/mensajes.css';

const API = 'http://localhost:3000';

interface MsgUI {
  id?: number;
  emisorId: number;
  contenido: string;
  tipo: string;
  fecha: string;
}

function Avatar({ src, nick, size = 42 }: { src: string | null; nick: string; size?: number }) {
  if (src) {
    return (
      <div className="mp-chat-item__avatar" style={{ width: size, height: size }}>
        <img src={`${API}${src}`} alt={nick} />
      </div>
    );
  }
  return (
    <div className="mp-chat-item__avatar" style={{ width: size, height: size }}>
      <i className="bi bi-person-fill" />
    </div>
  );
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatUltimo(contenido: string, tipo: string) {
  if (tipo === 'imagen') return '📷 Imagen';
  if (tipo === 'gif') return '🎞️ GIF';
  if (tipo === 'audio') return '🎵 Audio';
  return contenido.length > 40 ? contenido.slice(0, 40) + '…' : contenido;
}

export default function MensajesPage() {
  const { isAuthenticated, token, user } = useAuth();
  const { unreadChats, clearUnread, clearAll, subscribe, emitMessage } = usePrivateMessages();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [chats, setChats] = useState<ChatResumen[]>([]);
  const [chatActivo, setChatActivo] = useState<ChatResumen | null>(null);
  const [mensajes, setMensajes] = useState<MsgUI[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const messagesEnd = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatActivoRef = useRef<ChatResumen | null>(null);

  useEffect(() => { chatActivoRef.current = chatActivo; }, [chatActivo]);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isAuthenticated || !token) navigate('/login');
  }, [isAuthenticated, token, navigate]);

  /* ── Al montar: limpiar todos los no leídos (el usuario está en la página) ── */
  useEffect(() => {
    clearAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Cargar lista de chats ── */
  useEffect(() => {
    if (!token) return;
    chatsService
      .listarChats(token)
      .then(setChats)
      .catch(() => setError('No se pudieron cargar los mensajes'))
      .finally(() => setLoading(false));
  }, [token]);

  /* ── Abrir chat desde URL param ?userId=X ── */
  useEffect(() => {
    const uid = searchParams.get('userId');
    if (!uid || !token) return;
    const userId = Number(uid);
    if (isNaN(userId)) return;
    chatsService.getChatConUsuario(userId, token).then(chat => {
      // Convertir ChatCompleto a ChatResumen-compatible
      const resumen: ChatResumen = {
        id: chat.id,
        usuario1: chat.usuario1,
        usuario2: chat.usuario2,
        mensajes: chat.mensajes.map(m => ({
          id: m.id,
          contenido: m.contenido,
          tipo: m.tipo,
          fecha_creacion: m.fecha_creacion,
          emisorId: m.emisorId,
        })),
      };
      setChatActivo(resumen);
      setMensajes(
        chat.mensajes.map(m => ({
          id: m.id,
          emisorId: m.emisorId,
          contenido: m.contenido,
          tipo: m.tipo,
          fecha: m.fecha_creacion,
        }))
      );
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, token]);

  /* ── Suscribirse a mensajes entrantes vía contexto ── */
  const incomingHandler = useCallback((data: IncomingPrivateMsg) => {
    const current = chatActivoRef.current;
    if (current?.id === data.chatId) {
      // Chat activo: mostrar mensaje + limpiar no leído
      setMensajes(m => [...m, {
        emisorId: data.user.id,
        contenido: data.contenido,
        tipo: data.tipo,
        fecha: data.fecha,
      }]);
      clearUnread(data.chatId);
    }
    // Si no es el chat activo, el contexto ya lo marcó como no leído
    // Actualizar último mensaje en la lista del sidebar
    setChats(prev =>
      prev.map(c =>
        c.id === data.chatId
          ? { ...c, mensajes: [{ id: Date.now(), contenido: data.contenido, tipo: data.tipo, fecha_creacion: data.fecha, emisorId: data.user.id }] }
          : c
      )
    );
  }, [clearUnread]);

  useEffect(() => subscribe(incomingHandler), [subscribe, incomingHandler]);

  /* ── Abrir chat (Click en la lista) ── */
  const abrirChat = useCallback(async (chat: ChatResumen) => {
    if (!token) return;
    setChatActivo(chat);
    clearUnread(chat.id);
    const interlocutor = chat.usuario1.id === user?.id ? chat.usuario2 : chat.usuario1;
    try {
      const completo = await chatsService.getChatConUsuario(interlocutor.id, token);
      setMensajes(
        completo.mensajes.map((m: MensajePrivado) => ({
          id: m.id,
          emisorId: m.emisorId,
          contenido: m.contenido,
          tipo: m.tipo,
          fecha: m.fecha_creacion,
        }))
      );
    } catch {
      setMensajes([]);
    }
  }, [token, user?.id]);

  /* ── Enviar mensaje ── */
  const enviar = () => {
    const trimmed = texto.trim();
    if (!trimmed || !chatActivo || enviando) return;

    const interlocutor = chatActivo.usuario1.id === user?.id
      ? chatActivo.usuario2
      : chatActivo.usuario1;

    setEnviando(true);
    emitMessage(interlocutor.id, trimmed, 'texto');
    setTexto('');
    setEnviando(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatActivo || !token) return;
    const interlocutor = chatActivo.usuario1.id === user?.id
      ? chatActivo.usuario2
      : chatActivo.usuario1;
    setSubiendo(true);
    try {
      const { url } = await uploadService.uploadImage(file, token);
      emitMessage(interlocutor.id, url, 'imagen');
    } catch { /* silent */ }
    finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  /* ── SCROLL HASTA EL FONDO (AHORA SÍ QUE BAJA DEL TODO) ── */
  useEffect(() => {
    // Pequeño timeout para asegurar que React ya renderizó los mensajes en el DOM
    const timeoutId = setTimeout(() => {
      if (messagesEnd.current) {
        // 'block: "end"' asegura que el elemento final quede alineado con el borde inferior de la caja
        messagesEnd.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [mensajes]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="mp-page">
        <AppHeader />
        <div className="mp-loading">
          <i className="bi bi-arrow-repeat rs-spin" />
          <span>Cargando mensajes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mp-page">
        <AppHeader />
        <div className="mp-error">
          <i className="bi bi-exclamation-circle" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const interlocutorActivo = chatActivo
    ? (chatActivo.usuario1.id === user?.id ? chatActivo.usuario2 : chatActivo.usuario1)
    : null;

  return (
    <div className="mp-page">
      <div className="rs-grid" />
      <AppHeader />

      <section className="mp-hero">
        <span className="mp-hero__badge">✦ Privado</span>
        <h1 className="mp-hero__title">Mensajes</h1>
        <p className="mp-hero__sub">Tus conversaciones privadas en tiempo real</p>
      </section>

      <div className="mp-scroll-container">
        <div className="mp-body">
          <aside className="mp-sidebar">
            <p className="mp-sidebar__title">Conversaciones ({chats.length})</p>

            {chats.length === 0 && (
              <div className="mp-empty-list">
                <i className="bi bi-chat-dots" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                Aún no tienes mensajes privados
              </div>
            )}

            {chats.map(chat => {
              const interlocutor = chat.usuario1.id === user?.id ? chat.usuario2 : chat.usuario1;
              const ultimo = chat.mensajes[0];
              const isActive = chatActivo?.id === chat.id;
              const hasUnread = unreadChats.has(chat.id);

              return (
                <div
                  key={chat.id}
                  className={`mp-chat-item${isActive ? ' mp-chat-item--active' : ''}${hasUnread ? ' mp-chat-item--unread' : ''}`}
                  onClick={() => abrirChat(chat)}
                >
                  <Avatar src={interlocutor.avatar} nick={interlocutor.nickname} />
                  <div className="mp-chat-item__info">
                    <div className="mp-chat-item__nick">{interlocutor.nickname}</div>
                    {ultimo && (
                      <div className="mp-chat-item__last">
                        {formatUltimo(ultimo.contenido, ultimo.tipo)}
                      </div>
                    )}
                  </div>
                  {hasUnread && <span className="mp-chat-item__badge" title="Nuevo mensaje" />}
                </div>
              );
            })}
          </aside>

          <div className="mp-chat-panel">
            {!chatActivo ? (
              <div className="mp-chat-placeholder">
                <i className="bi bi-chat-square-dots" />
                <span>Selecciona una conversación para empezar</span>
              </div>
            ) : (
              <>
                <div className="mp-chat-header">
                  <div className="mp-chat-header__avatar">
                    {interlocutorActivo?.avatar
                      ? <img src={`${API}${interlocutorActivo.avatar}`} alt={interlocutorActivo.nickname} />
                      : <i className="bi bi-person-fill" />
                    }
                  </div>
                  <span className="mp-chat-header__nick">{interlocutorActivo?.nickname}</span>
                </div>

                <div className="mp-messages" ref={messagesContainerRef}>
                  {mensajes.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2rem' }}>
                      No hay mensajes aún — ¡sé el primero en escribir!
                    </div>
                  )}

                  {mensajes.map((msg, i) => {
                    const esMio = msg.emisorId === user?.id;
                    return (
                      <div key={msg.id ?? i} className={`mp-msg${esMio ? ' mp-msg--me' : ' mp-msg--other'}`}>
                        <div className="mp-msg__bubble">
                          {msg.tipo === 'imagen' || msg.tipo === 'gif' ? (
                            <img src={msg.contenido.startsWith('http') ? msg.contenido : `${API}${msg.contenido}`} alt="imagen" />
                          ) : (
                            msg.contenido
                          )}
                        </div>
                        <span className="mp-msg__time">{formatHora(msg.fecha)}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEnd} />
                </div>

                <div className="mp-input-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                  />
                  <button
                    className="mp-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendo || !chatActivo}
                    title="Adjuntar imagen"
                  >
                    {subiendo
                      ? <i className="bi bi-arrow-repeat rs-spin" />
                      : <i className="bi bi-paperclip" />}
                  </button>
                  <textarea
                    ref={textareaRef}
                    className="mp-input"
                    rows={1}
                    placeholder="Escribe un mensaje…"
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKey}
                  />
                  <button
                    className="mp-send-btn"
                    onClick={enviar}
                    disabled={!texto.trim() || enviando}
                    title="Enviar"
                  >
                    <i className="bi bi-send-fill" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AppFooter />
      
    </div>
  );
}