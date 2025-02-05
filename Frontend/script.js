document.addEventListener("DOMContentLoaded", function () {
    const socket = io("https://talk2muayyad-chat-app.onrender.com");

    // Check connection
    socket.on("connect", () => console.log("✅ Connected to WebSocket"));

    // Function to determine if the user is the owner (Muayyad)
    function isOwner() {
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    }

    // Function to get or prompt for the user's name
    function getUserName() {
        if (isOwner()) {
            return "Muayyad"; 
        }

        let userName = localStorage.getItem("chatUser");
        if (!userName || userName === "null") {
            userName = prompt("Enter your name:")?.trim() || "Anonymous"; 
            localStorage.setItem("chatUser", userName);
        }
        return userName;
    }

    // Get the user's name
    let userName = getUserName();
    socket.emit("joinRoom", userName); // Join private chat

    // Display the user's name
    document.getElementById("userNameDisplay").textContent = `Welcome, ${userName}!`;

    // Send message function
    function sendMessage() {
        const messageInput = document.getElementById("message");
        const message = messageInput.value.trim();
        if (!message) return;

        console.log("📤 Sending:", message);
        socket.emit("sendMessage", { message, sender: userName });
        messageInput.value = "";
    }

    // Attach sendMessage to the button
    document.querySelector("button").addEventListener("click", sendMessage);

    // Display received messages
    function displayMessage(msg) {
        const isSent = msg.sender === userName;
        const containerClass = isSent ? "sent" : "received";

        const messagesDiv = document.getElementById("messages");
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message-container", containerClass);
        msgDiv.innerHTML = `
            <div class="message">
                <strong>${msg.sender}</strong>: ${msg.message} 
                <small>${new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Listen for received messages
    socket.on("receiveMessage", displayMessage);

    // Load message history
    socket.on("messageHistory", (history) => {
        history.forEach(displayMessage);
    });
});
