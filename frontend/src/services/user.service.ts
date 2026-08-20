import api from './api';

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  avatar: string | null;
  estado: string;
  rol: string;
  estado_cuenta: string;
  fecha_creacion: string;
  ultima_conexion: string | null;
}

export interface UserSearch {
  estado_cuenta: string;
  id: number;
  nickname: string;
  avatar: string | null;
  estado: string;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const userService = {
  getMe: (token: string) =>
    api.get<UserProfile>('/api/users/me', { headers: authHeader(token) }).then(r => r.data),

  searchUsers: (q: string, token: string) =>
    api.get<UserSearch[]>(`/api/users/search?q=${encodeURIComponent(q)}`, { headers: authHeader(token) }).then(r => r.data),

  updateNickname: (nickname: string, token: string) =>
    api
      .put<UserProfile>('/api/users/me', { nickname }, { headers: authHeader(token) })
      .then(r => r.data),

  uploadAvatar: (file: File, token: string) => {
    const form = new FormData();
    form.append('avatar', file);
    return api
      .post<{ avatar: string; user: UserProfile }>('/api/users/me/avatar', form, {
        headers: { ...authHeader(token), 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },
};