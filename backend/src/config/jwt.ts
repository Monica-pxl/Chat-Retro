// Exporta clave secreta JWT desde .env
export const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido");
}