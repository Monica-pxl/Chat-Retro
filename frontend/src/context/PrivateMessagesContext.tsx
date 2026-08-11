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

interface PMContextValue {
  unreadChats: Set<number>;
  totalUnread: number;
  clearUnread: (chatId: number) => void;
  clearAll: () => void;
  subscribe: (handler: (data: IncomingPrivateMsg) => void) => () => void;
  subscribeSolicitud: (handler: SolicitudHandler) => () => void;
  emitMessage: (destinatarioId: number, contenido: string, tipo: string) => void;
}

const PMContext = createContext<PMContextValue>({
  unreadChats: new Set(),
  totalUnread: 0,
  clearUnread: () => {},
  clearAll: () => {},
  subscribe: () => () => {},
  subscribeSolicitud: () => () => {},
  emitMessage: () => {},
});

export function PrivateMessagesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [unreadChats, setUnreadChats] = useState<Set<number>>(new Set());
  const handlersRef = useRef<Set<(data: IncomingPrivateMsg) => void>>(new Set());
  const solicitudHandlersRef = useRef<Set<SolicitudHandler>>(new Set());

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

    socket.on('nueva-solicitud', (data: any) => {
      solicitudHandlersRef.current.forEach(h => h('nueva', data));
    });
    socket.on('solicitud-aceptada', (data: any) => {
      solicitudHandlersRef.current.forEach(h => h('aceptada', data));
    });
    socket.on('solicitud-rechazada', (data: any) => {
      solicitudHandlersRef.current.forEach(h => h('rechazada', data));
    });
    socket.on('solicitud-cancelada', (data: any) => {
      solicitudHandlersRef.current.forEach(h => h('cancelada', data));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

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

  return (
    <PMContext.Provider value={{
      unreadChats,
      totalUnread: unreadChats.size,
      clearUnread,
      clearAll,
      subscribe,
      subscribeSolicitud,
      emitMessage,
    }}>
      {children}
    </PMContext.Provider>
  );
}

export function usePrivateMessages(): PMContextValue {
  return useContext(PMContext);
}
