const socket = io();  
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = "w"; // Default player is white

const pieceUnicode = {
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚"
};

// Render the chessboard
const renderBoard = () => {
    boardElement.innerHTML = "";
    const board = chess.board();

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const piece = document.createElement("div");
               
                piece.classList.add("piece", square.color === 'w' ? "white" : "black");
                const pieceSymbol = square.color === 'w' 
                ? pieceUnicode[square.type.toUpperCase()]  // White ke liye uppercase
                : pieceUnicode[square.type.toLowerCase()]; // Black ke liye lowercase
        
            piece.innerText = pieceSymbol;
                piece.draggable = (playerRole === square.color && chess.turn() === playerRole);
                
                piece.addEventListener("dragstart", (e) => {
                    if (piece.draggable) {
                        draggedPiece = piece;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                piece.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(piece);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece && sourceSquare) {
                    const targetRow = parseInt(squareElement.dataset.row);
                    const targetCol = parseInt(squareElement.dataset.col);
                    const move = {
                        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
                        to: `${String.fromCharCode(97 + targetCol)}${8 - targetRow}`
                    };

                    socket.emit("move", move);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') boardElement.classList.add("flipped");
    else boardElement.classList.remove("flipped");
};

// WebSocket event listeners
socket.on("playerRole", (role) => {
    playerRole = role;
    if (role === "w") {
        const b = document.querySelector('.player');
        b.innerHTML = "<h3> PLAYER 1</h3>";
    } else if (role === "b") {
        const b = document.querySelector('.player');
        b.innerHTML = "<h3> PLAYER 2</h3>";
    }
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = "spectator";
    const b = document.querySelector('.player');
        b.innerHTML = "<h3> Game is already full! only you see </h3>";
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard();
