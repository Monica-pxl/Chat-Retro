import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

export interface Sala {
  id: number;
  tipo: 'general_anual' | 'epoca_estilo';
  ano: number | null;
  nombre: string;
  descripcion: string | null;
  cerrada: boolean;
  fecha_creacion: string;
  epoca: { id: number; nombre: string } | null;
  tematica: { id: number; nombre: string; descripcion: string | null } | null;
}

export interface MensajeSala {
  id: number;
  contenido: string;
  tipo: string;
  fecha_creacion: string;
  userId: number;
  user: {
    nickname: string;
    avatar: string | null;
  };
}

export const salasService = {
  getSalas: () =>
    api.get<Sala[]>('/salas').then(r => r.data),

  getSalaById: (id: number) =>
    api.get<Sala>(`/salas/${id}`).then(r => r.data),

  getMensajes: (id: number, token?: string) =>
    api
      .get<MensajeSala[]>(`/salas/${id}/mensajes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then(r => r.data),

  getOnlineCount: (id: number) =>
    api.get<{ count: number }>(`/salas/${id}/online`).then(r => r.data),
};
