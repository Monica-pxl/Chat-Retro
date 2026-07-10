/**
 * Módulo singleton que almacena en memoria el número de usuarios
 * autenticados actualmente dentro de cada sala.
 * Es actualizado por el socket handler y leído por el controlador REST.
 */
const counts = new Map<number, number>();

export function setRoomCount(roomId: number, count: number): void {
  counts.set(roomId, Math.max(0, count));
}

export function getRoomCount(roomId: number): number {
  return counts.get(roomId) ?? 0;
}
