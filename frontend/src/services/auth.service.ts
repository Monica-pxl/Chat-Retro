import api from './api';

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  avatar: string | null;
  rol: string;
  estado: string;
  estado_cuenta: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api
      .post<AuthResponse>('/auth/login', { email, password })
      .then(r => r.data),

  register: (email: string, password: string, nickname: string) =>
    api
      .post<AuthResponse>('/auth/register', { email, password, nickname })
      .then(r => r.data),

  logout: (token: string) =>
    api
      .post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.data),
};