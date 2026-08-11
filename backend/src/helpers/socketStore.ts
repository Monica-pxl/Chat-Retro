import { Server } from 'socket.io';

let _io: Server | null = null;
const _onlineUsers = new Map<number, Set<string>>();

export const setIo = (io: Server): void => { _io = io; };

export const addUserSocket = (userId: number, socketId: string): void => {
  const s = _onlineUsers.get(userId) ?? new Set<string>();
  s.add(socketId);
  _onlineUsers.set(userId, s);
};

export const removeUserSocket = (userId: number, socketId: string): void => {
  const s = _onlineUsers.get(userId);
  if (!s) return;
  s.delete(socketId);
  if (s.size === 0) _onlineUsers.delete(userId);
};

export const getOnlineUserIds = (): number[] => Array.from(_onlineUsers.keys());

export const emitToUser = (userId: number, event: string, data: unknown): void => {
  const sockets = _onlineUsers.get(userId);
  if (!sockets || !_io) return;
  for (const socketId of sockets) {
    _io.to(socketId).emit(event, data);
  }
};
