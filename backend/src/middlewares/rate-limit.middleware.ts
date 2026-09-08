import rateLimit from "express-rate-limit";

// Límite general para todas las rutas
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por ventana
  message: { error: "Demasiadas peticiones, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite estricto para login/register (protege contra fuerza bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: { error: "Demasiados intentos, espera 15 minutos" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No cuenta los intentos exitosos
});

// Límite para endpoints de admin
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // 50 peticiones
  message: { error: "Demasiadas peticiones administrativas" },
  standardHeaders: true,
  legacyHeaders: false,
});