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

export const userService = {
  getMe: () =>
    api.get<UserProfile>('/api/users/me').then(r => r.data),

  searchUsers: (q: string) =>
    api.get<UserSearch[]>(`/api/users/search?q=${encodeURIComponent(q)}`).then(r => r.data),

  updateNickname: (nickname: string) =>
    api
      .put<UserProfile>('/api/users/me', { nickname })
      .then(r => r.data),

  updatePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api
      .put<{ message: string }>('/api/users/me/password', { currentPassword, newPassword, confirmPassword }, {
        headers: { 'X-Skip-Auth-Redirect': 'true' },
      })
      .then(r => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api
      .post<{ avatar: string; user: UserProfile }>('/api/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },
  deleteAvatar: async (): Promise<UserProfile> => {
  const { data } = await api.delete('/api/users/me/avatar');
  return data;
}
};