import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes";
import { socketHandler } from "./sockets";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

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