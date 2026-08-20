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

const getToken = () => localStorage.getItem('rs_token');

const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const adminService = {
  // ✅ Usa GET
  getUsuarios: async (): Promise<AdminUser[]> => {
    const response = await axios.get(`${API}/admin/usuarios`, getHeaders());
    return response.data;
  },

  // ✅ CAMBIADO A PUT (Coincide con el backend)
  cambiarEstadoCuenta: async (
    userId: number,
    nuevoEstado: 'activa' | 'suspendida' | 'baneada'
  ): Promise<{ id: number; nickname: string; estado_cuenta: string }> => {
    const response = await axios.put(
      `${API}/admin/usuarios/${userId}/estado`,
      { estado_cuenta: nuevoEstado },
      getHeaders()
    );
    return response.data;
  },

  // ✅ CAMBIADO A PUT (Coincide con el backend)
  cambiarRol: async (
    userId: number,
    nuevoRol: 'user' | 'admin'
  ): Promise<{ id: number; nickname: string; rol: string }> => {
    const response = await axios.put(
      `${API}/admin/usuarios/${userId}/rol`,
      { rol: nuevoRol },
      getHeaders()
    );
    return response.data;
  },

  // ✅ Usa GET
  getEstadisticas: async (): Promise<AdminStats> => {
    const response = await axios.get(`${API}/admin/stats`, getHeaders());
    return response.data;
  },

  // ✅ CAMBIADO A PUT (Coincide con el backend)
  cerrarSala: async (salaId: number) => {
    const response = await axios.put(
      `${API}/admin/salas/${salaId}/cerrar`,
      {},
      getHeaders()
    );
    return response.data;
  },

  // ✅ CAMBIADO A PUT (Coincide con el backend)
  abrirSala: async (salaId: number) => {
    const response = await axios.put(
      `${API}/admin/salas/${salaId}/abrir`,
      {},
      getHeaders()
    );
    return response.data;
  },
};