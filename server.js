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
    // User Events
    socket.on("user:join", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User joined: ${userId}`);
    });
    // Socket connection handler
    // Task Events
    socket.on("task:join", (taskId,userId) => {
      socket.join(`task:${taskId}`);
      io.to(`task:${taskId}`).emit(`task:${taskId}:user-join`, userId);
      console.log(`Joined task room: ${taskId}`);
    });

    socket.on("task:leave", (taskId) => {
      socket.leave(`task:${taskId}`);
      io.to(`task:${taskId}`).emit(`task:${taskId}:user-leave`, userId);
      console.log(`Left task room: ${taskId}`);
    });

    socket.on("task:created", (task) => {
      console.log(task);
      [...task.assignments, { userId: task.user.id }].forEach(({ userId }) => {
        io.to(`user:${userId}`).emit("task:created", task);
      });
    });

    socket.on("task:updated", (task) => {
      // Notify each assignee individually
      [...task.assignments, { userId: task.user.id }].forEach(({ userId }) => {
        io.to(`user:${userId}`).emit("task:updated", task);
      });
    });

    socket.on("task:deleted", (task) => {
      // Notify each assignee individually
      [...task.assignments, { userId: task.user.id }].forEach(({ userId }) => {
        io.to(`user:${userId}`).emit("task:deleted", task.id);
      });
    });

    // Content change events
    // socket.on("task:content:update", ({ taskId, changes }) => {
    //   socket.to(`task:${taskId}`).emit("task:content:changed", {
    //     taskId,
    //     changes,
    //   });
    // });

    // // Listen for cursor and mouse movements from clients
    socket.on("task:cursor-move", (taskId, cursorData) => {
      // Broadcast to other clients (not the sender)
      io.to(`task:${taskId}`).emit(`task:${taskId}:cursor-move`, cursorData);
    });

    socket.on("task:mouse-move", (taskId, mouseData) => {
      // Broadcast to other clients (not the sender)
      io.to(`task:${taskId}`).emit(`task:${taskId}:mouse-move`, mouseData);
    });

    socket.on("task:indicator-update", (taskId, mouseData) => {
      // Broadcast to other clients (not the sender)
      io.to(`task:${taskId}`).emit(`task:${taskId}:indicator-update`, mouseData);
    });

    socket.on("task:operation", (taskId, mouseData) => {
      // Broadcast to other clients (not the sender)
      io.to(`task:${taskId}`).emit(`task:${taskId}:operation`, mouseData);
    });

    socket.on("task:content-change", (taskId, data) => {
      // Broadcast to other clients (not the sender)
      io.to(`task:${taskId}`).emit(`task:${taskId}:content-change`, data);
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
