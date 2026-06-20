const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("WebRTC Signaling Server is running."));

const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket",  
  cors: { 
    origin: "stream.vincentchan.uk",
    methods: ["GET", "POST"]
  }
});

const recommendationsByCode = new Map();
const watchers = new Set();
const broadcasters = new Set();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("broadcaster", () => {
    broadcasters.add(socket.id);
    socket.broadcast.emit("broadcaster");
  });

  socket.on("watcher", () => {
    watchers.add(socket.id);
    socket.broadcast.emit("watcher", socket.id);
  });

  socket.on("offer", (to, desc) => socket.to(to).emit("offer", socket.id, desc));
  socket.on("answer", (to, desc) => socket.to(to).emit("answer", socket.id, desc));
  socket.on("candidate", (to, cand) => socket.to(to).emit("candidate", socket.id, cand));

  socket.on("disconnect", () => {
    broadcasters.delete(socket.id);
    watchers.delete(socket.id);
    socket.broadcast.emit("disconnectPeer", socket.id);
  });

  socket.on("joinRoom", (code) => {
    socket.join(code);
    const recs = recommendationsByCode.get(code);
    if (recs) socket.emit("recommendations", recs);
  });

  socket.on("recommendations", ({ code, recs }) => {
    recommendationsByCode.set(code, recs);
    io.to(code).emit("recommendations", recs);
  });

  socket.on("navigate", ({ code, url }) => {
    io.to(code).emit("navigate", { code, url });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`WebRTC Signaling server listening on port ${PORT}`);
});