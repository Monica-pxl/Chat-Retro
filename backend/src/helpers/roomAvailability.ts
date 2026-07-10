import { Sala } from "@prisma/client";

export const canJoinRoom = (sala: Sala): boolean => {
  const now = new Date();

  const day = now.getDay(); // 0 domingo - 6 sábado
  const hour = now.getHours();
  const month = now.getMonth() + 1; // 1-12
  const date = now.getDate();

  switch (sala.nombre) {

    // ========================
    // FIESTA
    // Viernes y sábados
    // 22:00 -> 05:30 (del día siguiente)
    // ========================

    case "Fiesta 90s":
    case "Fiesta 2000s":

      // Viernes: de 22:00 a 23:59
      if (day === 5 && hour >= 22) return true;

      // Sábado: de 00:00 a 05:30 (madrugada del sábado, viene del viernes noche)
      //          Y de 22:00 a 23:59 (sábado noche, va al domingo)
      if (day === 6) {
        if (hour < 6 || hour >= 22) return true;
      }

      // Domingo: de 00:00 a 05:30 (madrugada del domingo, viene del sábado noche)
      if (day === 0 && hour < 6) return true;

      return false;


    // ========================
    // NAVIDAD
    // 20 diciembre -> 6 enero
    // ========================

    case "Navidad 90s":
    case "Navidad 2000s":

      if (
        (month === 12 && date >= 20) ||
        (month === 1 && date <= 6)
      ) {
        return true;
      }

      return false;


    // ========================
    // TV SHOWS
    // 19:00 -> 05:30
    // ========================

    case "TV Shows 90s":
    case "TV Shows 2000s":

      if (hour >= 19 || hour < 6) {
        return true;
      }

      return false;


    // ========================
    // SALAS GENERALES
    // ========================

    default:
      return true;
  }
};