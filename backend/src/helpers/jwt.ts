//Funciones para generar y verificar tokens JWT (expiración 7 días):
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

export const generateToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};