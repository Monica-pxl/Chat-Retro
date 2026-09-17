import api from './api';

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
  listarAmigos: () =>
    api.get<AmigoItem[]>('/amigos').then(r => r.data),

  listarSolicitudesRecibidas: () =>
    api.get<Solicitud[]>('/amigos/solicitudes').then(r => r.data),

  listarSolicitudesEnviadas: () =>
    api.get<Solicitud[]>('/amigos/solicitudes/enviadas').then(r => r.data),

  aceptar: (id: number) =>
    api.put(`/amigos/solicitud/${id}/aceptar`).then(r => r.data),

  rechazar: (id: number) =>
    api.put(`/amigos/solicitud/${id}/rechazar`).then(r => r.data),

  cancelar: (id: number) =>
    api.delete(`/amigos/solicitud/${id}`).then(r => r.data),

  enviarSolicitud: (receptorId: number) =>
    api.post('/amigos/solicitud', { receptorId }).then(r => r.data),

  eliminarAmigo: (amigoId: number) =>
    api.delete(`/amigos/${amigoId}`).then(r => r.data),
};

/* ── Chats privados ── */
export const chatsService = {
  listarChats: () =>
    api.get<ChatResumen[]>('/chats').then(r => r.data),

  getChatConUsuario: (userId: number) =>
    api.get<ChatCompleto>(`/chats/${userId}`).then(r => r.data),
};