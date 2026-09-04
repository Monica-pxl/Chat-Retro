import api from './api';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/* ── Tipos ── */
export interface AmigoItem {
  amistadId: number;
  desde: string;
  amigo: { 
    id: number; 
    nickname: string; 
    avatar: string | null; 
    estado: string;
    estado_cuenta: string; // 🔥 AÑADIDO PARA CORREGIR EL ERROR DE TIPOS
  };
}

export interface Solicitud {
  id: number;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fecha_creacion: string;
  emisor: { id: number; nickname: string; avatar: string | null };
  receptor: { id: number; nickname: string; avatar: string | null };
}

export interface MensajePrivado {
  id: number;
  contenido: string;
  tipo: string;
  fecha_creacion: string;
  emisorId: number;
  emisor: { id: number; nickname: string; avatar: string | null };
}

export interface ChatCompleto {
  id: number;
  usuario1: { id: number; nickname: string; avatar: string | null; estado_cuenta: string };
  usuario2: { id: number; nickname: string; avatar: string | null; estado_cuenta: string };
  mensajes: MensajePrivado[];
}

export interface ChatResumen {
  id: number;
  usuario1: { id: number; nickname: string; avatar: string | null; estado_cuenta: string };
  usuario2: { id: number; nickname: string; avatar: string | null; estado_cuenta: string };
  mensajes: Array<{
    id: number;
    contenido: string;
    tipo: string;
    fecha_creacion: string;
    emisorId: number;
  }>;
}

/* ── Amigos ── */
export const amigosService = {
  listarAmigos: (token: string) =>
    api.get<AmigoItem[]>('/amigos', { headers: auth(token) }).then(r => r.data),

  listarSolicitudesRecibidas: (token: string) =>
    api.get<Solicitud[]>('/amigos/solicitudes', { headers: auth(token) }).then(r => r.data),

  listarSolicitudesEnviadas: (token: string) =>
    api.get<Solicitud[]>('/amigos/solicitudes/enviadas', { headers: auth(token) }).then(r => r.data),

  aceptar: (id: number, token: string) =>
    api.put(`/amigos/solicitud/${id}/aceptar`, {}, { headers: auth(token) }).then(r => r.data),

  rechazar: (id: number, token: string) =>
    api.put(`/amigos/solicitud/${id}/rechazar`, {}, { headers: auth(token) }).then(r => r.data),

  cancelar: (id: number, token: string) =>
    api.delete(`/amigos/solicitud/${id}`, { headers: auth(token) }).then(r => r.data),

  enviarSolicitud: (receptorId: number, token: string) =>
    api.post('/amigos/solicitud', { receptorId }, { headers: auth(token) }).then(r => r.data),

  eliminarAmigo: (amigoId: number, token: string) =>
    api.delete(`/amigos/${amigoId}`, { headers: auth(token) }).then(r => r.data),
};

/* ── Chats privados ── */
export const chatsService = {
  listarChats: (token: string) =>
    api.get<ChatResumen[]>('/chats', { headers: auth(token) }).then(r => r.data),

  getChatConUsuario: (userId: number, token: string) =>
    api.get<ChatCompleto>(`/chats/${userId}`, { headers: auth(token) }).then(r => r.data),
};