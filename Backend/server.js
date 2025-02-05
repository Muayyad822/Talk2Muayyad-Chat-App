const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

let messages = {}; // Store messages per user

// WebSocket connection
io.on("connection", (socket) => {
    console.log("🔗 New client connected:", socket.id);

    // User joins a private chat room
    socket.on("joinRoom", (userName) => {
        if (!userName || userName === "null") return;

        socket.join(userName); // Join personal room
        socket.join("Muayyad"); // Muayyad sees all chats

        console.log(`${userName} joined room: ${userName}`);

        // Send chat history
        if (messages[userName]) {
            socket.emit("messageHistory", messages[userName]);
        } else {
            messages[userName] = [];
        }
    });

    // Receive and send messages privately
    socket.on("sendMessage", (msg) => {
        const { sender, message } = msg;
        if (!sender || sender === "null") return;

        console.log("📩 Received message:", msg);

        const timestamp = new Date().toISOString();
        const chatMessage = { sender, message, timestamp };

        if (!messages[sender]) messages[sender] = [];
        messages[sender].push(chatMessage);

        // Send message only to sender & Muayyad
        io.to(sender).to("Muayyad").emit("receiveMessage", chatMessage);
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
