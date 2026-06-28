import React, { useState, useEffect } from "react";
import { Users, User, RotateCcw, Award } from "lucide-react";

export default function LocalTicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState("single");
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);

  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem("tictactoe_scores");
    return saved ? JSON.parse(saved) : { x: 0, o: 0, ties: 0 };
  });

  const winLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  // Reset scores
  const resetScores = () => {
    const newScores = { x: 0, o: 0, ties: 0 };
    setScores(newScores);
    localStorage.setItem("tictactoe_scores", JSON.stringify(newScores));
  };

  // Check for winner
  useEffect(() => {
    let gameWon = false;

    for (let i = 0; i < winLines.length; i++) {
      const [a, b, c] = winLines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setWinningLine(winLines[i]);
        gameWon = true;

        // Update score
        setScores((prev) => {
          const updated = {
            ...prev,
            x: board[a] === "X" ? prev.x + 1 : prev.x,
            o: board[a] === "O" ? prev.o + 1 : prev.o,
          };
          localStorage.setItem("tictactoe_scores", JSON.stringify(updated));
          return updated;
        });
        break;
      }
    }

    if (!gameWon && board.every((cell) => cell !== null)) {
      setWinner("Draw");
      setScores((prev) => {
        const updated = { ...prev, ties: prev.ties + 1 };
        localStorage.setItem("tictactoe_scores", JSON.stringify(updated));
        return updated;
      });
    }
  }, [board]);

  // CPU Move Logic
  useEffect(() => {
    if (gameMode === "single" && !xIsNext && !winner) {
      const timer = setTimeout(() => {
        makeCPUMove();
      }, 500); // realistic think delay
      return () => clearTimeout(timer);
    }
  }, [xIsNext, gameMode, winner, board]);

  const makeCPUMove = () => {
    const emptyIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((v) => v !== null);

    if (emptyIndices.length === 0) return;

    // 1. Try to Win: find if O can win in 1 move
    for (const line of winLines) {
      const [a, b, c] = line;
      const cells = [board[a], board[b], board[c]];
      const oCount = cells.filter((c) => c === "O").length;
      const nullCount = cells.filter((c) => c === null).length;

      if (oCount === 2 && nullCount === 1) {
        const emptyIdx = line.find((i) => board[i] === null);
        if (emptyIdx !== undefined) {
          triggerMove(emptyIdx, "O");
          return;
        }
      }
    }

    // 2. Try to Block: find if X can win in 1 move, and block it
    for (const line of winLines) {
      const [a, b, c] = line;
      const cells = [board[a], board[b], board[c]];
      const xCount = cells.filter((c) => c === "X").length;
      const nullCount = cells.filter((c) => c === null).length;

      if (xCount === 2 && nullCount === 1) {
        const emptyIdx = line.find((i) => board[i] === null);
        if (emptyIdx !== undefined) {
          triggerMove(emptyIdx, "O");
          return;
        }
      }
    }

    // 3. Take Center if available
    if (board[4] === null) {
      triggerMove(4, "O");
      return;
    }

    // 4. Take Corners if available
    const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
    if (corners.length > 0) {
      const randomCorner = corners[Math.floor(Math.random() * corners.length)];
      triggerMove(randomCorner, "O");
      return;
    }

    // 5. Random move
    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    triggerMove(randomIdx, "O");
  };

  const triggerMove = (index, player) => {
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    setXIsNext(player === "X" ? false : true);
  };

  const handleCellClick = (index) => {
    // Block if cell is taken, or it's CPU's turn in single player, or game is over
    if (board[index] !== null || winner) return;
    if (gameMode === "single" && !xIsNext) return;

    triggerMove(index, xIsNext ? "X" : "O");
  };

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto">
      {/* Game Mode Controls */}
      <div className="w-full flex justify-between gap-3 mb-4">
        <button
          onClick={() => {
            setGameMode("single");
            restartGame();
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 border font-medium text-xs transition-all ${
            gameMode === "single"
              ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-md shadow-purple-950"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-300"
          }`}
        >
          <User className="w-4 h-4" />
          VS CPU (Solo)
        </button>
        <button
          onClick={() => {
            setGameMode("pvp");
            restartGame();
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 border font-medium text-xs transition-all ${
            gameMode === "pvp"
              ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-950"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          LOCAL PVP (2P)
        </button>
      </div>

      {/* Score Tracker HUD */}
      <div className="w-full grid grid-cols-3 bg-gray-900 border border-gray-800 p-3 rounded-xl mb-4 text-center">
        <div>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">PLAYER X</p>
          <p className="text-lg font-bold font-mono text-purple-400">{scores.x}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">TIES</p>
          <p className="text-lg font-bold font-mono text-gray-400">{scores.ties}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">
            {gameMode === "single" ? "CPU O" : "PLAYER O"}
          </p>
          <p className="text-lg font-bold font-mono text-blue-400">{scores.o}</p>
        </div>
      </div>

      {/* Turn indicator or result banner */}
      <div className="mb-4 h-8 flex items-center justify-center">
        {winner ? (
          winner === "Draw" ? (
            <p className="text-sm font-bold text-amber-400 tracking-wide">IT'S A DRAW!</p>
          ) : (
            <p className="text-sm font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 glow-text-primary">
              👑 {winner === "X" ? "PLAYER X" : gameMode === "single" ? "CPU" : "PLAYER O"} WINS!
            </p>
          )
        ) : (
          <p className="text-xs text-gray-400 flex items-center gap-1.5 font-mono">
            CURRENT TURN:{" "}
            <span
              className={`font-bold text-sm ${
                xIsNext ? "text-purple-400" : "text-blue-400"
              }`}
            >
              {xIsNext ? "X" : "O"}
            </span>
            {gameMode === "single" && !xIsNext && " (Thinking...)"}
          </p>
        )}
      </div>

      {/* 3x3 Grid Board */}
      <div className="grid grid-cols-3 gap-2 bg-gray-900/50 border-4 border-gray-800 p-2 rounded-xl w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`relative rounded-lg font-black text-4xl sm:text-5xl transition-all duration-200 flex items-center justify-center border border-gray-800/80 cursor-pointer ${
                cell === null ? "bg-gray-950 hover:bg-gray-900/60" : "bg-gray-950"
              } ${
                isWinningCell
                  ? cell === "X"
                    ? "bg-purple-950/40 border-purple-500 text-purple-300 shadow-md shadow-purple-900/50"
                    : "bg-blue-950/40 border-blue-500 text-blue-300 shadow-md shadow-blue-900/50"
                  : ""
              }`}
            >
              {/* Marker X */}
              {cell === "X" && (
                <span className="text-purple-500 glow-text-primary animate-scale-up">X</span>
              )}

              {/* Marker O */}
              {cell === "O" && (
                <span className="text-blue-400 glow-text-primary animate-scale-up">O</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Buttons */}
      <div className="w-full flex gap-3 mt-5">
        <button
          onClick={restartGame}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
          PLAY AGAIN
        </button>
        <button
          onClick={resetScores}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent hover:bg-rose-950/20 text-gray-500 hover:text-rose-400 border border-transparent hover:border-rose-900/50 py-2.5 rounded-xl text-xs transition-all"
        >
          RESET STATS
        </button>
      </div>
    </div>
  );
}
