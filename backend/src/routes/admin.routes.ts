import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  getUsuarios,
  updateEstadoCuenta,
  cambiarRol,
  cerrarSala,
  abrirSala,
  getEstadisticas,
} from "../controllers/admin.controller";

const router = Router();

// Todas las rutas requieren estar autenticado y ser admin
router.use(authMiddleware, adminMiddleware);

// Usuarios
router.get("/usuarios", getUsuarios);
router.put("/usuarios/:id/estado", updateEstadoCuenta);
router.put("/usuarios/:id/rol", cambiarRol);

// Salas
router.put("/salas/:id/cerrar", cerrarSala);
router.put("/salas/:id/abrir", abrirSala);

// Estadísticas
router.get("/stats", getEstadisticas);

export default router;
