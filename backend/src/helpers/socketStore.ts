// Guarda quien está online y como conectarlo:
import { Server } from 'socket.io';

// Guarda la instancia de Socket.IO para usarla globalmente
let _io: Server | null = null;

// Guarda usuarios online: userId -> Set de socketIds (permite múltiples pestañas)
const _onlineUsers = new Map<number, Set<string>>();

// Guarda y obtiene la instancia de Socket.IO
export const setIo = (io: Server): void => { _io = io; };
export const getIo = (): Server | null => _io;

// Añade un socket a un usuario (cuando se conecta)
export const addUserSocket = (userId: number, socketId: string): void => {
  const s = _onlineUsers.get(userId) ?? new Set<string>();
  s.add(socketId);
  _onlineUsers.set(userId, s);
};

// Elimina un socket de un usuario (cuando se desconecta)
export const removeUserSocket = (userId: number, socketId: string): void => {
  const s = _onlineUsers.get(userId);
  if (!s) return;
  s.delete(socketId);
  if (s.size === 0) _onlineUsers.delete(userId);
};

// Devuelve lista de usuarios online
export const getOnlineUserIds = (): number[] => Array.from(_onlineUsers.keys());

// Envía un evento a TODOS los sockets de un usuario específico (notificaciones, mensajes privados)
export const emitToUser = (userId: number, event: string, data: unknown): void => {
  const sockets = _onlineUsers.get(userId);
  if (!sockets || !_io) return;
  for (const socketId of sockets) {
    _io.to(socketId).emit(event, data);
  }
};