import api from './api';

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
  getUsuarios: async (): Promise<AdminUser[]> => {
    const response = await api.get<AdminUser[]>('/admin/usuarios');
    return response.data;
  },

  cambiarEstadoCuenta: async (
    userId: number,
    nuevoEstado: 'activa' | 'suspendida' | 'baneada',
  ): Promise<{ id: number; nickname: string; estado_cuenta: string }> => {
    const response = await api.put(`/admin/usuarios/${userId}/estado`, {
      estado_cuenta: nuevoEstado,
    });
    return response.data;
  },

  cambiarRol: async (
    userId: number,
    nuevoRol: 'user' | 'admin',
  ): Promise<{ id: number; nickname: string; rol: string }> => {
    const response = await api.put(`/admin/usuarios/${userId}/rol`, { rol: nuevoRol });
    return response.data;
  },

  getEstadisticas: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },

  cerrarSala: async (salaId: number) => {
    const response = await api.put(`/admin/salas/${salaId}/cerrar`);
    return response.data;
  },

  abrirSala: async (salaId: number) => {
    const response = await api.put(`/admin/salas/${salaId}/abrir`);
    return response.data;
  },
};