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
    // Viernes y sábado
    // 22:00 -> 05:30
    // ========================

    case "Fiesta 90s":
    case "Fiesta 2000s":

      // Viernes desde las 22:00
      if (day === 5 && hour >= 22) return true;

      // Sábado todo el día hasta las 23:59
      if (day === 6) return true;

      // Domingo hasta las 05:30
      if (day === 0 && hour < 6) return true;

      return false;


    // ========================
    // TROPICAL
    // 21 junio -> 31 agosto
    // ========================

    case "Tropical 90s":
    case "Tropical 2000s":

      if (
        (month === 6 && date >= 21) ||
        month === 7 ||
        month === 8
      ) {
        return true;
      }

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