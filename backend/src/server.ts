import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import uploadRoutes from "./routes/upload.routes";

import authRoutes from "./routes/auth.routes";
import salaRoutes from "./routes/sala.routes";
import chatRoutes from "./routes/chat.routes";
import amistadRoutes from "./routes/amistad.routes";
import adminRoutes from "./routes/admin.routes";
import { socketHandler } from "./sockets";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/salas", salaRoutes);
app.use("/chats", chatRoutes);
app.use("/amigos", amistadRoutes);
app.use("/admin", adminRoutes);
app.use("/upload", uploadRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// HTTP server
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 aquí conectas todo el sistema de sockets
socketHandler(io);


server.listen(3000, () => {
  console.log("🚀 Backend con Socket.IO funcionando");
});