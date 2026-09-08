import xss from "xss";

export const sanitizeMessage = (text: string): string => {
  if (!text) return "";
  
  // Eliminar espacios al inicio/fin
  let sanitized = text.trim();
  
  // Limitar longitud máxima (1000 caracteres ya está en sockets)
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  // Sanitizar contra XSS
  sanitized = xss(sanitized, {
    whiteList: {}, // No permite ninguna etiqueta HTML
    stripIgnoreTag: true, // Elimina etiquetas no permitidas
    stripIgnoreTagBody: ['script', 'style'], // Elimina contenido de script/style
  });
  
  return sanitized;
};