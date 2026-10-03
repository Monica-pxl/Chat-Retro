import { Sala } from "@prisma/client";

const FIESTA_ROOMS = new Set(["Fiesta 90s", "Fiesta 2000s"]);

export const isScheduledFiestaRoom = (sala: Pick<Sala, "nombre">): boolean =>
  FIESTA_ROOMS.has(sala.nombre);

export const canJoinRoom = (sala: Sala): boolean => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";

  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
  const month = Number(part("month"));
  const date = Number(part("day"));
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));

  switch (sala.nombre) {

    // ========================
    // FIESTA
    // Viernes y sábados
    // 22:00 -> 05:30 (del día siguiente)
    // ========================

    case "Fiesta 90s":
    case "Fiesta 2000s":

      // Viernes: desde las 22:00 hasta medianoche.
      if (day === 5 && minutes >= 22 * 60) return true;

      // Sábado: madrugada hasta las 05:30 y desde las 22:00.
      if (day === 6) {
        if (minutes < 5 * 60 + 30 || minutes >= 22 * 60) return true;
      }

      // Domingo: madrugada hasta las 05:30, continuación del sábado.
      if (day === 0 && minutes < 5 * 60 + 30) return true;

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
    // SALAS GENERALES
    // ========================

    default:
      return true;
  }
};

export const isRoomClosed = (sala: Sala): boolean => {
  if (isScheduledFiestaRoom(sala)) {
    return !canJoinRoom(sala);
  }

  return sala.cerrada || !canJoinRoom(sala);
};