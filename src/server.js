import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // Listen for cursor and mouse movements from clients
    socket.on("cursor-move", (cursorData) => {
      // Broadcast to other clients (not the sender)
      socket.broadcast.emit("cursor-move", cursorData);
    });

    socket.on("mouse-move", (mouseData) => {
      // Broadcast to other clients (not the sender)
      socket.broadcast.emit("mouse-move", mouseData);
    });

    socket.on("content-change", (newText) => {
      // Broadcast to other clients (not the sender)
      socket.broadcast.emit("content-change", newText);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port}`);
  });
});
