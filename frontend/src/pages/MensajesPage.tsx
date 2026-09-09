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

// 🔥 MAPA DE TEMAS CON GRANATE BRILLANTE
const TEMAS = {
  azul: { 
    accent: '#00d4ff', 
    mainBg: '#06060e',
    glow: 'rgba(0, 212, 255, 0.15)',
    btnBg: 'rgba(0, 212, 255, 0.15)',
    border: 'rgba(0, 212, 255, 0.25)',
    msgMioBg: 'rgba(0, 212, 255, 0.20)'
  },
  rosa: { 
    accent: '#f472b6', 
    mainBg: '#0e060a',
    glow: 'rgba(244, 114, 182, 0.12)',
    btnBg: 'rgba(244, 114, 182, 0.15)',
    border: 'rgba(244, 114, 182, 0.25)',
    msgMioBg: 'rgba(244, 114, 182, 0.20)'
  },
  dorado: { 
    accent: '#fbbf24', 
    mainBg: '#0f0c06',
    glow: 'rgba(251, 191, 36, 0.12)',
    btnBg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.25)',
    msgMioBg: 'rgba(251, 191, 36, 0.20)'
  },
  rojo: { 
    accent: '#b91c1c',
    mainBg: '#0a0404',
    glow: 'rgba(185, 28, 28, 0.15)',
    btnBg: 'rgba(185, 28, 28, 0.20)',
    border: 'rgba(239, 68, 68, 0.50)',
    msgMioBg: 'rgba(185, 28, 28, 0.25)'
  },
  morado: { 
    accent: '#a855f7', 
    mainBg: '#0a060e',
    glow: 'rgba(168, 85, 247, 0.12)',
    btnBg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.25)',
    msgMioBg: 'rgba(168, 85, 247, 0.20)'
  },
  verde_oscuro: { 
    accent: '#10b981', 
    mainBg: '#060e08',
    glow: 'rgba(16, 185, 129, 0.12)',
    btnBg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.25)',
    msgMioBg: 'rgba(16, 185, 129, 0.20)'
  },
};

type TemaKey = keyof typeof TEMAS;

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
  const { unreadChats, clearUnread, clearAll, subscribe, emitMessage} = usePrivateMessages();
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
  const [eliminando, setEliminando] = useState<Set<number>>(new Set());

  // 🔥 ESTADO DEL TEMA Y VISIBILIDAD
  const [tema, setTema] = useState<TemaKey>(() => {
    const saved = localStorage.getItem('mp_color_tema') as TemaKey | null;
    return saved && TEMAS[saved] ? saved : 'azul';
  });
  
  const [selectorVisible, setSelectorVisible] = useState(() => {
    const saved = localStorage.getItem('mp_selector_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const cambiarTema = (nuevoTema: TemaKey) => {
    setTema(nuevoTema);
    localStorage.setItem('mp_color_tema', nuevoTema);
  };

  const toggleSelector = () => {
    const newVal = !selectorVisible;
    localStorage.setItem('mp_selector_visible', JSON.stringify(newVal));
    setSelectorVisible(newVal);
  };

  const messagesEnd = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatActivoRef = useRef<ChatResumen | null>(null);

  useEffect(() => { chatActivoRef.current = chatActivo; }, [chatActivo]);

  useEffect(() => {
    if (!isAuthenticated || !token) navigate('/login');
  }, [isAuthenticated, token, navigate]);

  useEffect(() => { clearAll(); }, []);

  useEffect(() => {
    if (!token) return;
    chatsService.listarChats(token)
      .then(setChats)
      .catch(() => setError('No se pudieron cargar los mensajes'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const uid = searchParams.get('userId');
    if (!uid || !token) return;
    
    if (user?.estado_cuenta === 'suspendida') {
      navigate('/mensajes');
      return;
    }

    const userId = Number(uid);
    if (isNaN(userId)) return;
    chatsService.getChatConUsuario(userId, token).then(chat => {
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
      setMensajes(chat.mensajes.map(m => ({
        id: m.id,
        emisorId: m.emisorId,
        contenido: m.contenido,
        tipo: m.tipo,
        fecha: m.fecha_creacion,
      })));
    }).catch(() => {});
  }, [searchParams, token, user, navigate]);

  const incomingHandler = useCallback((data: IncomingPrivateMsg) => {
    const current = chatActivoRef.current;
    if (current?.id === data.chatId) {
      setMensajes(m => [...m, {
        emisorId: data.user.id,
        contenido: data.contenido,
        tipo: data.tipo,
        fecha: data.fecha,
      }]);
      clearUnread(data.chatId);
    }
    setChats(prev => prev.map(c =>
      c.id === data.chatId
        ? { ...c, mensajes: [{ id: Date.now(), contenido: data.contenido, tipo: data.tipo, fecha_creacion: data.fecha, emisorId: data.user.id }] }
        : c
    ));
  }, [clearUnread]);

  useEffect(() => subscribe(incomingHandler), [subscribe, incomingHandler]);

  const abrirChat = useCallback(async (chat: ChatResumen) => {
    if (!token) return;
    setChatActivo(chat);
    clearUnread(chat.id);
    const interlocutor = chat.usuario1.id === user?.id ? chat.usuario2 : chat.usuario1;
    try {
      const completo = await chatsService.getChatConUsuario(interlocutor.id, token);
      setMensajes(completo.mensajes.map((m: MensajePrivado) => ({
        id: m.id,
        emisorId: m.emisorId,
        contenido: m.contenido,
        tipo: m.tipo,
        fecha: m.fecha_creacion,
      })));
    } catch { setMensajes([]); }
  }, [token, user?.id]);

  const enviar = () => {
    if (user?.estado_cuenta === 'suspendida') {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'warning', 
          message: 'Cuenta suspendida. No puedes enviar mensajes.' 
        }
      }));
      return;
    }

    const trimmed = texto.trim();
    if (!trimmed || !chatActivo || enviando) return;
    const interlocutor = chatActivo.usuario1.id === user?.id ? chatActivo.usuario2 : chatActivo.usuario1;

    if (interlocutor.estado_cuenta !== 'activa') {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'warning', 
          message: 'No puedes enviar mensajes a este usuario porque su cuenta está suspendida o baneada.' 
        }
      }));
      return;
    }

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
    const interlocutor = chatActivo.usuario1.id === user?.id ? chatActivo.usuario2 : chatActivo.usuario1;
    if (interlocutor.estado_cuenta !== 'activa') {
      e.target.value = '';
      return;
    }
    setSubiendo(true);
    try {
      const { url } = await uploadService.uploadImage(file, token);
      emitMessage(interlocutor.id, url, 'imagen');
    } catch { /* silent */ }
    finally { setSubiendo(false); e.target.value = ''; }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEnd.current) {
        messagesEnd.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [mensajes]);

  if (!isAuthenticated) return null;

  const estaSuspendido = user?.estado_cuenta === 'suspendida';

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

  const interlocutorBloqueado = interlocutorActivo ? interlocutorActivo.estado_cuenta !== 'activa' : false;

  const currentTheme = TEMAS[tema];

  return (
    <div 
      className="mp-page" 
      style={{
        '--accent-color': currentTheme.accent,
        '--main-bg': currentTheme.mainBg,
        '--glow-color': currentTheme.glow,
        '--btn-bg': currentTheme.btnBg,
        '--border-color': currentTheme.border,
        '--msg-mio-bg': currentTheme.msgMioBg,
        '--badge-bg': currentTheme.btnBg,
      } as React.CSSProperties}
    >
      <div className="rs-grid" />
      <AppHeader />

      <section className="mp-hero">
        
        {/* 🔥 SELECTOR DE TEMAS EN COLUMNA */}
        <div className="mp-theme-selector-wrapper">
          <button 
            className="mp-theme-toggle"
            onClick={toggleSelector}
            title="Mostrar / Ocultar selector de temas"
          >
            TEMAS
          </button>
          
          {selectorVisible && (
            <div className="mp-theme-options">
              {(Object.keys(TEMAS) as TemaKey[]).map(key => {
                const isActive = tema === key;
                const color = TEMAS[key].accent;
                return (
                  <button
                    key={key}
                    onClick={() => cambiarTema(key)}
                    title={key}
                    className={`mp-theme-btn${isActive ? ' mp-theme-btn--active' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="mp-hero-center">
          <span className="mp-hero__badge">✦ Privado</span>
          <h1 className="mp-hero__title">Mensajes</h1>
          <p className="mp-hero__sub">Tus conversaciones privadas en tiempo real</p>
        </div>
        
      </section>

      {estaSuspendido && (
        <div className="mp-suspend-notice">
          <i className="bi bi-lock-fill" />
          <span>Tu cuenta está suspendida: no puedes escribir mensajes, pero sí puedes leer los que te envíen.</span>
        </div>
      )}

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
                    {ultimo && <div className="mp-chat-item__last">{formatUltimo(ultimo.contenido, ultimo.tipo)}</div>}
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
                      : <i className="bi bi-person-fill" />}
                  </div>
                  <span className="mp-chat-header__nick">{interlocutorActivo?.nickname}</span>
                </div>

                {interlocutorBloqueado && (
                  <div className="mp-suspend-notice">
                    <i className="bi bi-lock-fill" />
                    <span>Este usuario tiene la cuenta {interlocutorActivo?.estado_cuenta === 'baneada' ? 'baneada' : 'suspendida'}: no puedes enviarle mensajes.</span>
                  </div>
                )}

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
                          ) : (msg.contenido)}
                        </div>
                        <span className="mp-msg__time">{formatHora(msg.fecha)}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEnd} />
                </div>

                <div className="mp-input-area">
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                  <button 
                    className="mp-attach-btn" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={subiendo || !chatActivo || estaSuspendido || interlocutorBloqueado}
                    title={estaSuspendido ? "Cuenta suspendida: no puedes enviar archivos" : interlocutorBloqueado ? "Este usuario no puede recibir mensajes" : "Adjuntar imagen"}
                  >
                    {subiendo ? <i className="bi bi-arrow-repeat rs-spin" /> : <i className="bi bi-paperclip" />}
                  </button>
                  <textarea 
                    ref={textareaRef} 
                    className="mp-input" 
                    rows={1} 
                    placeholder={estaSuspendido ? "Cuenta suspendida: no puedes escribir" : interlocutorBloqueado ? "Este usuario no puede recibir mensajes" : "Escribe un mensaje…"} 
                    value={texto} 
                    onChange={e => setTexto(e.target.value)} 
                    onKeyDown={handleKey} 
                    disabled={estaSuspendido || interlocutorBloqueado}
                    title={estaSuspendido ? "Cuenta suspendida: no puedes escribir mensajes" : interlocutorBloqueado ? "Este usuario no puede recibir mensajes" : undefined}
                  />
                  <button 
                    className="mp-send-btn" 
                    onClick={enviar} 
                    disabled={!texto.trim() || enviando || estaSuspendido || interlocutorBloqueado}
                    title={estaSuspendido ? "Cuenta suspendida: no puedes enviar mensajes" : interlocutorBloqueado ? "Este usuario no puede recibir mensajes" : "Enviar"}
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