// Se comunica con sockets/index.ts del backend para manejar mensajes privados y solicitudes de amistad entre otros:

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
import { amigosService, chatsService } from '../services/amigos.service';
import { sanitizeMessage } from '../utils/sanitize';

const API = 'http://localhost:3000';

export interface IncomingPrivateMsg {
  chatId: number;
  id: number;
  user: { id: number; nickname: string; avatar: string | null };
  destinatarioId: number;
  contenido: string;
  tipo: string;
  fecha: string;
  fromRoomId?: number | null;
}

export type SolicitudEvento = 'nueva' | 'aceptada' | 'rechazada' | 'cancelada';
export type SolicitudHandler = (tipo: SolicitudEvento, data: any) => void;

export type FriendStatus = 'ninguno' | 'amigo' | 'enviada' | 'recibida';

interface PMContextValue {
  unreadChats: Set<number>;
  totalUnread: number;
  // 🔥 notificaciones para el navbar (excluye mensajes de la misma sala)
  navbarUnread: number;
  clearUnread: (chatId: number) => void;
  markChatRead: (chatId: number, messageId: number | undefined) => void;
  clearAll: () => void;
  subscribe: (handler: (data: IncomingPrivateMsg) => void) => () => void;
  subscribeSolicitud: (handler: SolicitudHandler) => () => void;
  // 🔥 eliminar mensajes privados
  deletePrivateMessage: (mensajeId: number) => Promise<void>;
  subscribeDeleted: (handler: (mensajeId: number, chatId: number) => void) => () => void;
  emitMessage: (destinatarioId: number, contenido: string, tipo: string) => void;
  friends: Set<number>;
  getFriendStatus: (userId: number) => FriendStatus;
  isUserOnline: (userId: number) => boolean;
  pendingReceivedCount: number;
  refreshAmistades: () => Promise<void>;
  sendFriendRequest: (userId: number) => Promise<void>;
  cancelFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
  // 🔥 sala actual
  setCurrentRoomId: (roomId: number | null) => void;
  currentRoomId: number | null;
}

const PMContext = createContext<PMContextValue>({
  unreadChats: new Set(),
  totalUnread: 0,
  navbarUnread: 0,
  clearUnread: () => {},
  markChatRead: () => {},
  clearAll: () => {},
  subscribe: () => () => {},
  subscribeSolicitud: () => () => {},
  deletePrivateMessage: async () => {},
  subscribeDeleted: () => () => {},
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
  setCurrentRoomId: () => {},
  currentRoomId: null,
});

export function PrivateMessagesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [unreadChats, setUnreadChats] = useState<Set<number>>(new Set());
  
  // 🔥 chats que deben mostrar la bolita del navbar
  const [navbarUnreadChats, setNavbarUnreadChats] = useState<Set<number>>(new Set());
  
  // 🔥 sala actual donde está el usuario
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const currentRoomIdRef = useRef<number | null>(null);
  useEffect(() => { currentRoomIdRef.current = currentRoomId; }, [currentRoomId]);

  const handlersRef = useRef<Set<(data: IncomingPrivateMsg) => void>>(new Set());
  const solicitudHandlersRef = useRef<Set<SolicitudHandler>>(new Set());
  // 🔥 handlers para mensajes eliminados
  const deletedHandlersRef = useRef<Set<(mensajeId: number, chatId: number) => void>>(new Set());

  const [friends, setFriends] = useState<Set<number>>(new Set());
  const [sentPending, setSentPending] = useState<Map<number, number>>(new Map());
  const [receivedPending, setReceivedPending] = useState<Map<number, number>>(new Map());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const tokenRef = useRef<string | null>(null);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const readMarkersKey = user ? `rs_read_private_chats_${user.id}` : null;

  const refreshUnreadChats = useCallback(async () => {
    if (!readMarkersKey || !user) return;

    try {
      const chats = await chatsService.listarChats();
      const stored = localStorage.getItem(readMarkersKey);
      const readMarkers = stored ? JSON.parse(stored) as Record<string, number> : {};
      const unread = new Set<number>();

      for (const chat of chats) {
        const latest = chat.mensajes[0];
        const lastReadId = readMarkers[String(chat.id)] ?? 0;

        if (latest && latest.emisorId !== user.id && latest.id > lastReadId) {
          unread.add(chat.id);
        }
      }

      setUnreadChats(unread);
      setNavbarUnreadChats(unread);
    } catch {
      /* silencioso */
    }
  }, [readMarkersKey, user]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(API, { auth: { token } });
    socketRef.current = socket;

    // 🔥 MODIFICADO: ahora comprueba si el mensaje viene de la misma sala
    socket.on('receive-private-message', (data: IncomingPrivateMsg) => {
      const esMensajePropio = data.user.id === user?.id;

      if (esMensajePropio) {
        handlersRef.current.forEach(h => h(data));
        return;
      }

      setUnreadChats(prev => new Set(prev).add(data.chatId));
      
      setNavbarUnreadChats(prev => new Set(prev).add(data.chatId));
      
      handlersRef.current.forEach(h => h(data));
    });

    socket.on('private-message-error', (data: { message: string }) => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'warning', message: data.message }
      }));
    });

    // 🔥 NUEVO: escuchar eliminación de mensajes
    socket.on('private-message-deleted', (data: { mensajeId: number; chatId: number }) => {
      deletedHandlersRef.current.forEach(h => h(data.mensajeId, data.chatId));
    });

    socket.on('online-users', (ids: number[]) => {
      setOnlineUserIds(new Set(ids));
    });

    socket.on('nueva-solicitud', (data: any) => {
      setReceivedPending(prev => new Map(prev).set(data.emisor.id, data.id));
      solicitudHandlersRef.current.forEach(h => h('nueva', data));
    });

    socket.on('solicitud-aceptada', (data: any) => {
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
  }, [isAuthenticated, token, user]);

  const refreshAmistades = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const [amigos, enviadas, recibidas] = await Promise.all([
        amigosService.listarAmigos(),
        amigosService.listarSolicitudesEnviadas(),
        amigosService.listarSolicitudesRecibidas(),
      ]);
      setFriends(new Set(amigos.map(a => a.amigo.id)));
      setSentPending(new Map(enviadas.map(s => [s.receptor.id, s.id])));
      setReceivedPending(new Map(recibidas.map(s => [s.emisor.id, s.id])));
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshAmistades();
      refreshUnreadChats();
    } else {
      setFriends(new Set());
      setSentPending(new Map());
      setReceivedPending(new Map());
      setUnreadChats(new Set());
      setNavbarUnreadChats(new Set());
    }
  }, [isAuthenticated, token, refreshAmistades, refreshUnreadChats]);

  const clearUnread = useCallback((chatId: number) => {
    setUnreadChats(prev => { const s = new Set(prev); s.delete(chatId); return s; });
    setNavbarUnreadChats(prev => { const s = new Set(prev); s.delete(chatId); return s; });
  }, []);

  const markChatRead = useCallback((chatId: number, messageId: number | undefined) => {
    if (!readMarkersKey || messageId === undefined) return;

    const stored = localStorage.getItem(readMarkersKey);
    const readMarkers = stored ? JSON.parse(stored) as Record<string, number> : {};
    readMarkers[String(chatId)] = messageId;
    localStorage.setItem(readMarkersKey, JSON.stringify(readMarkers));

    clearUnread(chatId);
  }, [clearUnread, readMarkersKey]);

  const clearAll = useCallback(() => {
    setUnreadChats(new Set());
    setNavbarUnreadChats(new Set());
  }, []);

  const subscribe = useCallback((handler: (data: IncomingPrivateMsg) => void) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  const subscribeSolicitud = useCallback((handler: SolicitudHandler) => {
    solicitudHandlersRef.current.add(handler);
    return () => { solicitudHandlersRef.current.delete(handler); };
  }, []);

  // 🔥 NUEVO: subscribe a mensajes eliminados
  const subscribeDeleted = useCallback((handler: (mensajeId: number, chatId: number) => void) => {
    deletedHandlersRef.current.add(handler);
    return () => { deletedHandlersRef.current.delete(handler); };
  }, []);

  // 🔥 NUEVO: eliminar mensaje privado
  const deletePrivateMessage = useCallback(async (mensajeId: number) => {
    try {
      await chatsService.eliminarMensaje(mensajeId);
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al eliminar el mensaje';
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'error', message: mensaje }
      }));
    }
  }, []);

  const emitMessage = useCallback((destinatarioId: number, contenido: string, tipo: string) => {
    const contenidoSanitizado = sanitizeMessage(contenido);

    if (!contenidoSanitizado) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'warning', message: 'El mensaje contiene contenido no permitido' }
      }));
      return;
    }

    // 🔥 Enviar también la sala actual para que el backend sepa de dónde viene
    socketRef.current?.emit('private-message', {
      destinatarioId,
      contenido: contenidoSanitizado,
      tipo,
      fromRoomId: currentRoomIdRef.current
    });
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
    const data = await amigosService.enviarSolicitud(userId);
    setSentPending(prev => new Map(prev).set(userId, data.id));
  }, []);

  const cancelFriendRequest = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    const solicitudId = sentPending.get(userId);
    if (!t || !solicitudId) return;
    await amigosService.cancelar(solicitudId);
    setSentPending(prev => { const next = new Map(prev); next.delete(userId); return next; });
  }, [sentPending]);

  const acceptFriendRequest = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    const solicitudId = receivedPending.get(userId);
    if (!t || !solicitudId) return;
    await amigosService.aceptar(solicitudId);
    setReceivedPending(prev => { const next = new Map(prev); next.delete(userId); return next; });
    setFriends(prev => new Set(prev).add(userId));
  }, [receivedPending]);

  const removeFriend = useCallback(async (userId: number) => {
    const t = tokenRef.current;
    if (!t) return;
    await amigosService.eliminarAmigo(userId);
    setFriends(prev => { const next = new Set(prev); next.delete(userId); return next; });
  }, []);

  return (
    <PMContext.Provider value={{
      unreadChats,
      totalUnread: unreadChats.size,
      navbarUnread: navbarUnreadChats.size,
      clearUnread,
      markChatRead,
      clearAll,
      subscribe,
      subscribeSolicitud,
      deletePrivateMessage,
      subscribeDeleted,
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
      setCurrentRoomId,
      currentRoomId,
    }}>
      {children}
    </PMContext.Provider>
  );
}

export function usePrivateMessages(): PMContextValue {
  return useContext(PMContext);
}