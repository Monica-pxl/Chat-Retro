import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('rs_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    const skipAuthRedirect = error.config?.headers?.['X-Skip-Auth-Redirect'] === 'true';

    // Un 401 de una operación sensible puede ser un error de datos, no de sesión.
    if (status === 401 && !skipAuthRedirect) {
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