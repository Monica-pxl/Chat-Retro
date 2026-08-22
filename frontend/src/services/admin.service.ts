import axios from 'axios';

const API = 'http://localhost:3000';

export interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  avatar: string | null;
  estado: 'en_linea' | 'ocupado' | 'ausente' | 'desconectado';
  rol: 'user' | 'admin';
  estado_cuenta: 'activa' | 'suspendida' | 'baneada';
  fecha_creacion: string;
  ultima_conexion: string | null;
}

export interface AdminStats {
  usuarios: number;
  usuariosActivos: number;
  usuariosSuspendidos: number;
  usuariosBaneados: number;
  usuariosOnline: number;
  salas: number;
  salasAbiertas: number;
  salasCerradas: number;
  amistades: number;
  chatsPrivados: number;
}

// ✅ Función auxiliar que acepta token opcional
const getHeaders = (token?: string) => {
  const authToken = token || localStorage.getItem('rs_token');
  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };
};

export const adminService = {
  // ✅ AHORA ACEPTAN TOKEN OPCIONAL
  getUsuarios: async (token?: string): Promise<AdminUser[]> => {
    const response = await axios.get(`${API}/admin/usuarios`, getHeaders(token));
    return response.data;
  },

  cambiarEstadoCuenta: async (
    userId: number,
    nuevoEstado: 'activa' | 'suspendida' | 'baneada',
    token?: string
  ): Promise<{ id: number; nickname: string; estado_cuenta: string }> => {
    const response = await axios.put(
      `${API}/admin/usuarios/${userId}/estado`,
      { estado_cuenta: nuevoEstado },
      getHeaders(token)
    );
    return response.data;
  },

  cambiarRol: async (
    userId: number,
    nuevoRol: 'user' | 'admin',
    token?: string
  ): Promise<{ id: number; nickname: string; rol: string }> => {
    const response = await axios.put(
      `${API}/admin/usuarios/${userId}/rol`,
      { rol: nuevoRol },
      getHeaders(token)
    );
    return response.data;
  },

  // ✅ AHORA ACEPTA TOKEN COMO PARÁMETRO
  getEstadisticas: async (token?: string): Promise<AdminStats> => {
    const response = await axios.get(`${API}/admin/stats`, getHeaders(token));
    return response.data;
  },

  cerrarSala: async (salaId: number, token?: string) => {
    const response = await axios.put(
      `${API}/admin/salas/${salaId}/cerrar`,
      {},
      getHeaders(token)
    );
    return response.data;
  },

  abrirSala: async (salaId: number, token?: string) => {
    const response = await axios.put(
      `${API}/admin/salas/${salaId}/abrir`,
      {},
      getHeaders(token)
    );
    return response.data;
  },
};