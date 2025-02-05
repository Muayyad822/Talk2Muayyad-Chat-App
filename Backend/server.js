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

        console.log(`${userName} joined room: ${userName}`);

        // Send chat history for the user
        const userMessages = messages[userName] || [];
        const receivedMessages = Object.entries(messages)
            .filter(([sender, msgs]) => sender !== userName) // Exclude user's own messages
            .flatMap(([sender, msgs]) => msgs.filter(msg => msg.sender === userName || msg.receiver === userName)); // Include messages where user is sender or receiver

        const allMessages = [...userMessages, ...receivedMessages];
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp

        socket.emit("messageHistory", allMessages);
    });

    // Special user "Muayyad" joins a specific user's room
    socket.on("joinUserRoom", (userName) => {
        if (socket.userName !== "Muayyad") return; // Only allow "Muayyad" to join user rooms

        socket.join(userName); // Join the specified user's room
        console.log(`Muayyad joined room: ${userName}`);

        // Send chat history for the specified user
        const userMessages = messages[userName] || [];
        socket.emit("messageHistory", userMessages);
    });

    // Receive and send messages privately
    socket.on("sendMessage", (msg) => {
        const { sender, message, receiver } = msg;
        if (!sender || sender === "null") return;

        console.log("📩 Received message:", msg);

        const timestamp = new Date().toISOString();
        const chatMessage = { sender, message, timestamp, receiver };

        if (!messages[sender]) messages[sender] = [];
        messages[sender].push(chatMessage);

        // Send message to the sender and the receiver (if specified)
        io.to(sender).emit("receiveMessage", chatMessage);
        if (receiver) {
            io.to(receiver).emit("receiveMessage", chatMessage);
        }
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});