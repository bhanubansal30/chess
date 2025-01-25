const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const chess = new Chess();
let players = {}; // Stores white and black player socket IDs
let currentPlayer = "w"; // White starts

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Online Chess Game" });
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Assign player roles (White, Black, or Spectator)
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    // Handle player disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        if (socket.id === players.white) delete players.white;
        else if (socket.id === players.black) delete players.black;
    });

    // Handle move event
    socket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move:", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log("Move error:", err);
            socket.emit("invalidMove", move);
        }
    });

    // Send current board state to newly connected users
    socket.emit("boardState", chess.fen());
});

server.listen(5000, () => {
    console.log("Server is running on port 3000");
});
