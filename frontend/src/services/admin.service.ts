import axios from 'axios';

const API = 'http://localhost:3000';

/* ==========================================================
   Tipos de datos que devuelve tu backend
========================================================== */
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

export const adminService = {
  // 1. Obtener todos los usuarios
  getUsuarios: async (token: string): Promise<AdminUser[]> => {
    const response = await axios.get(`${API}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 2. Cambiar estado de cuenta (activa, suspendida, baneada)
  cambiarEstadoCuenta: async (
    userId: number,
    nuevoEstado: 'activa' | 'suspendida' | 'baneada',
    token: string
  ): Promise<{ id: number; nickname: string; estado_cuenta: string }> => {
    const response = await axios.patch(
      `${API}/admin/usuario/${userId}/estado`,
      { estado_cuenta: nuevoEstado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 3. Cambiar rol de usuario
  cambiarRol: async (
    userId: number,
    nuevoRol: 'user' | 'admin',
    token: string
  ): Promise<{ id: number; nickname: string; rol: string }> => {
    const response = await axios.patch(
      `${API}/admin/usuario/${userId}/rol`,
      { rol: nuevoRol },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 4. Obtener Estadísticas Globales (Tu Dashboard)
  getEstadisticas: async (token: string): Promise<AdminStats> => {
    const response = await axios.get(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 5. Cerrar Sala
  cerrarSala: async (salaId: number, token: string) => {
    const response = await axios.post(
      `${API}/admin/sala/${salaId}/cerrar`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 6. Abrir Sala
  abrirSala: async (salaId: number, token: string) => {
    const response = await axios.post(
      `${API}/admin/sala/${salaId}/abrir`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};