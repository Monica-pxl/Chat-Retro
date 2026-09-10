import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    // 🔥 Error 401: No autenticado → redirigir a login
    if (status === 401) {
      localStorage.removeItem('rs_token');
      localStorage.removeItem('rs_user');
      window.location.href = '/login';
    }

    // 🔥 Error 500: Error del servidor → redirigir a 500
    if (status === 500) {
      window.location.href = '/error/500';
    }

    return Promise.reject(error);
  },
);

export default api;