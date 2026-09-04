import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { amigosService } from '../services/amigos.service';

const API = 'http://localhost:3000';

export interface IncomingPrivateMsg {
  chatId: number;
  user: { id: number; nickname: string; avatar: string | null };
  destinatarioId: number;
  contenido: string;
  tipo: string;
  fecha: string;
}

export type SolicitudEvento = 'nueva' | 'aceptada' | 'rechazada' | 'cancelada';
export type SolicitudHandler = (tipo: SolicitudEvento, data: any) => void;

/* Estado de amistad de un usuario respecto al usuario autenticado */
export type FriendStatus = 'ninguno' | 'amigo' | 'enviada' | 'recibida';

interface PMContextValue {
  unreadChats: Set<number>;
  totalUnread: number;
  clearUnread: (chatId: number) => void;
  clearAll: () => void;
  subscribe: (handler: (data: IncomingPrivateMsg) => void) => () => void;
  subscribeSolicitud: (handler: SolicitudHandler) => () => void;
  emitMessage: (destinatarioId: number, contenido: string, tipo: string) => void;
  /* Amistad en tiempo real */
  friends: Set<number>;
  getFriendStatus: (userId: number) => FriendStatus;
  isUserOnline: (userId: number) => boolean;
  pendingReceivedCount: number;
  refreshAmistades: () => Promise<void>;
  sendFriendRequest: (userId: number) => Promise<void>;
  cancelFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
}

const PMContext = createContext<PMContextValue>({
  unreadChats: new Set(),
  totalUnread: 0,
  clearUnread: () => {},
  clearAll: () => {},
  subscribe: () => () => {},
  subscribeSolicitud: () => () => {},
  emitMessage: () => {},
  friends: new Set(),
  getFriendStatus: () => 'ninguno',
  isUserOnline: () => false,
  pendingReceivedCount: 0,
  refreshAmistades: async () => {},
  sendFriendRequest: async () => {},
  cancelFriendRequest: async () => {},
  acceptFriendRequest: async () => {},
  removeFriend: async () => {},
});

export function PrivateMessagesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [unreadChats, setUnreadChats] = useState<Set<number>>(new Set());
  const handlersRef = useRef<Set<(data: IncomingPrivateMsg) => void>>(new Set());
  const solicitudHandlersRef = useRef<Set<SolicitudHandler>>(new Set());

  /* ── Estado global de amistad (amigos + solicitudes pendientes) ── */
  const [friends, setFriends] = useState<Set<number>>(new Set());
  const [sentPending, setSentPending] = useState<Map<number, number>>(new Map());
  const [receivedPending, setReceivedPending] = useState<Map<number, number>>(new Map());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const tokenRef = useRef<string | null>(null);
  useEffect(() => { tokenRef.current = token; }, [token]);

  /* ── Conexión socket única por sesión ── */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(API, { auth: { token } });
    socketRef.current = socket;

    socket.on('receive-private-message', (data: IncomingPrivateMsg) => {
      setUnreadChats(prev => new Set(prev).add(data.chatId));
      handlersRef.current.forEach(h => h(data));
    });

    // 🔥 Si el mensaje privado es rechazado (p. ej. cuenta suspendida), avisamos al usuario
    socket.on('private-message-error', (data: { message: string }) => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'warning', message: data.message }
      }));
    });

    // Lista global de usuarios conectados (emitida en cada conexión/desconexión)
    socket.on('online-users', (ids: number[]) => {
      setOnlineUserIds(new Set(ids));
    });

    socket.on('nueva-solicitud', (data: any) => {
      // Alguien nos envió una solicitud: la registramos como recibida pendiente
      setReceivedPending(prev => new Map(prev).set(data.emisor.id, data.id));
      solicitudHandlersRef.current.forEach(h => h('nueva', data));
    });
    socket.on('solicitud-aceptada', (data: any) => {
      // Nuestra solicitud enviada fue aceptada: pasa a ser amistad
      setSentPending(prev => {
        const next = new Map(prev);
        for (const [uid, sid] of next) {
          if (sid === data.id) { next.delete(uid); setFriends(f => new Set(f).add(uid)); break; }
        }
        return next;
      });
      solicitudHandlersRef.current.forEach(h => h('aceptada', data));
    });
    socket.on('solicitud-rechazada', (data: any) => {
      setSentPending(prev => {
        const next = new Map(prev);
        for (const [uid, sid] of next) {
          if (sid === data.id) { next.delete(uid); break; }
        }
        return next;
      });
      solicitudHandlersRef.current.forEach(h => h('rechazada', data));
    });
    socket.on('solicitud-cancelada', (data: any) => {
      setReceivedPending(prev => {
        const next = new Map(prev);
        for (const [uid, sid] of next) {
          if (sid === data.id) { next.delete(uid); break; }
        }
        return next;
      });
      solicitudHandlersRef.current.forEach(h => h('cancelada', data));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  /* ── Cargar estado inicial de amistades ── */
  const refreshAmistades = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const [amigos, enviadas, recibidas] = await Promise.all([
        amigosService.listarAmigos(t),
        amigosService.listarSolicitudesEnviadas(t),
        amigosService.listarSolicitudesRecibidas(t),
      ]);
      setFriends(new Set(amigos.map(a => a.amigo.id)));
      setSentPending(new Map(enviadas.map(s => [s.receptor.id, s.id])));
      setReceivedPending(new Map(recibidas.map(s => [s.emisor.id, s.id])));
    } catch {
      /* silencioso: no bloquear la UI si falla la carga inicial */
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshAmistades();
    } else {
      setFriends(new Set());
      setSentPending(new Map());
      setReceivedPending(new Map());
    }
  }, [isAuthenticated, token, refreshAmistades]);

  /* ── API pública ── */
  const clearUnread = useCallback((chatId: number) => {
    setUnreadChats(prev => { const s = new Set(prev); s.delete(chatId); return s; });
  }, []);

  const clearAll = useCallback(() => {
    setUnreadChats(new Set());
  }, []);

  const subscribe = useCallback((handler: (data: IncomingPrivateMsg) => void) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  const subscribeSolicitud = useCallback((handler: SolicitudHandler) => {
    solicitudHandlersRef.current.add(handler);
    return () => { solicitudHandlersRef.current.delete(handler); };
  }, []);

  const emitMessage = useCallback((destinatarioId: number, contenido: string, tipo: string) => {
    socketRef.current?.emit('private-message', { destinatarioId, contenido, tipo });
  }, []);

  const getFriendStatus = useCallback((userId: number): FriendStatus => {
    if (friends.has(userId)) return 'amigo';
    if (sentPending.has(userId)) return 'enviada';
    if (receivedPending.has(userId)) return 'recibida';
    return 'ninguno';
  }, [friends, sentPending, receivedPending]);

  const isUserOnline = useCallback((userId: number) => onlineUserIds.has(userId), [onlineUserIds]);

  const sendFriendRequest = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    if (!t) return;
    const data = await amigosService.enviarSolicitud(userId, t);
    setSentPending(prev => new Map(prev).set(userId, data.id));
  }, []);

  const cancelFriendRequest = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    const solicitudId = sentPending.get(userId);
    if (!t || !solicitudId) return;
    await amigosService.cancelar(solicitudId, t);
    setSentPending(prev => { const next = new Map(prev); next.delete(userId); return next; });
  }, [sentPending]);

  const acceptFriendRequest = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    const solicitudId = receivedPending.get(userId);
    if (!t || !solicitudId) return;
    await amigosService.aceptar(solicitudId, t);
    setReceivedPending(prev => { const next = new Map(prev); next.delete(userId); return next; });
    setFriends(prev => new Set(prev).add(userId));
  }, [receivedPending]);

  const removeFriend = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    if (!t) return;
    await amigosService.eliminarAmigo(userId, t);
    setFriends(prev => { const next = new Set(prev); next.delete(userId); return next; });
  }, []);

  return (
    <PMContext.Provider value={{
      unreadChats,
      totalUnread: unreadChats.size,
      clearUnread,
      clearAll,
      subscribe,
      subscribeSolicitud,
      emitMessage,
      friends,
      getFriendStatus,
      isUserOnline,
      pendingReceivedCount: receivedPending.size,
      refreshAmistades,
      sendFriendRequest,
      cancelFriendRequest,
      acceptFriendRequest,
      removeFriend,
    }}>
      {children}
    </PMContext.Provider>
  );
}

export function usePrivateMessages(): PMContextValue {
  return useContext(PMContext);
}
