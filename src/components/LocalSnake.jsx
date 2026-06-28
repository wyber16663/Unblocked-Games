import React, { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Pause, Award } from "lucide-react";

export default function LocalSnake() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snake_highscore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(100); // ms per tick

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 5, y: 5 });
  const directionRef = useRef("RIGHT");
  const lastDirectionRef = useRef("RIGHT");

  const GRID_SIZE = 20;

  // Keydown handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;

      if ((key === "arrowup" || key === "w") && currentDir !== "DOWN") {
        directionRef.current = "UP";
      } else if ((key === "arrowdown" || key === "s") && currentDir !== "UP") {
        directionRef.current = "DOWN";
      } else if ((key === "arrowleft" || key === "a") && currentDir !== "RIGHT") {
        directionRef.current = "LEFT";
      } else if ((key === "arrowright" || key === "d") && currentDir !== "LEFT") {
        directionRef.current = "RIGHT";
      } else if (key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const generateFood = () => {
    let newFood;
    let onSnake = true;
    while (onSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on the snake
      onSnake = snakeRef.current.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
      if (!onSnake) {
        foodRef.current = newFood;
      }
    }
  };

  const resetGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    directionRef.current = "RIGHT";
    lastDirectionRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    generateFood();
  };

  // Game Loop
  useEffect(() => {
    if (isPaused || gameOver) return;

    const gameTick = () => {
      const snake = [...snakeRef.current];
      const head = { ...snake[0] };
      const dir = directionRef.current;
      lastDirectionRef.current = dir;

      switch (dir) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Check collision with walls
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPaused(true);
        return;
      }

      // Check collision with self
      if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        setIsPaused(true);
        return;
      }

      // Add head
      snake.unshift(head);

      // Check eating food
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore((s) => {
          const newScore = s + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("snake_highscore", newScore.toString());
          }
          return newScore;
        });
        generateFood();
      } else {
        snake.pop();
      }

      snakeRef.current = snake;
      draw();
    };

    const interval = setInterval(gameTick, speed);
    return () => clearInterval(interval);
  }, [isPaused, gameOver, speed, highScore]);

  // Canvas Drawing
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    // Clear board with dark arcade background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines (Subtle)
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * size);
      ctx.lineTo(canvas.width, i * size);
      ctx.stroke();
    }

    // Draw Food (Neon Pink Circle with Outer Glow)
    const fx = foodRef.current.x * size + size / 2;
    const fy = foodRef.current.y * size + size / 2;
    const radius = size / 2.5;

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#f43f5e";
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Snake (Neon Green Segment with Glow)
    snakeRef.current.forEach((segment, idx) => {
      const x = segment.x * size;
      const y = segment.y * size;

      ctx.save();
      if (idx === 0) {
        // Head (Bright Green with Stronger Glow)
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#10b981";
        ctx.fillStyle = "#34d399";
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

        // Eyes
        ctx.fillStyle = "#047857";
        const eyeOffset = size / 4;
        const eyeSize = size / 6;
        const dir = lastDirectionRef.current;

        if (dir === "UP" || dir === "DOWN") {
          ctx.fillRect(x + eyeOffset, y + size / 2 - eyeSize / 2, eyeSize, eyeSize);
          ctx.fillRect(x + size - eyeOffset - eyeSize, y + size / 2 - eyeSize / 2, eyeSize, eyeSize);
        } else {
          ctx.fillRect(x + size / 2 - eyeSize / 2, y + eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + size / 2 - eyeSize / 2, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
        }
      } else {
        // Body (Glow decreases slightly along the tail)
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#059669";
        // Gradient coloring
        const ratio = idx / snakeRef.current.length;
        ctx.fillStyle = `rgb(${Math.floor(16 + ratio * 20)}, ${Math.floor(185 - ratio * 60)}, ${Math.floor(129 - ratio * 30)})`;
        ctx.fillRect(x + 1.5, y + 1.5, size - 3, size - 3);
      }
      ctx.restore();
    });
  };

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [gameOver]);

  // Adjust canvas aspect on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 400;
    canvas.height = 400;
    draw();
    generateFood();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center p-4 bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl max-w-lg mx-auto">
      {/* HUD Header */}
      <div className="w-full flex justify-between items-center bg-gray-900 border border-gray-800 p-3 rounded-xl mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          <div className="text-left">
            <p className="text-[10px] text-gray-500 font-mono tracking-wider">HIGH SCORE</p>
            <p className="text-lg font-bold font-mono text-yellow-400">{highScore}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-gray-400 font-mono tracking-wider">SCORE</p>
          <p className="text-2xl font-black font-mono text-emerald-400 glow-text-primary">{score}</p>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">SPEED</p>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setSpeed(140)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                speed === 140 ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-gray-800 border-transparent text-gray-400"
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setSpeed(100)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                speed === 100 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-gray-800 border-transparent text-gray-400"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setSpeed(60)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                speed === 60 ? "bg-rose-500/20 border-rose-500 text-rose-400" : "bg-gray-800 border-transparent text-gray-400"
              }`}
            >
              Hard
            </button>
          </div>
        </div>
      </div>

      {/* Screen Wrapper */}
      <div className="relative border-4 border-gray-800 rounded-lg overflow-hidden shadow-inner bg-gray-950 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Start / Pause / Game Over Overlay */}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-wide glow-text-primary">RETRO SNAKE</h3>
            <p className="text-xs text-gray-400 mb-6 max-w-[250px] leading-relaxed">
              Use <span className="text-emerald-400 font-mono">ARROW KEYS</span> or <span className="text-emerald-400 font-mono">WASD</span> to steer. Press Spacebar to Pause.
            </p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              START GAME
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm border-2 border-rose-500/50 rounded-md">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-1 tracking-wider glow-text-primary">GAME OVER</h3>
            <p className="text-xs text-gray-400 mb-2">Final Score</p>
            <p className="text-4xl font-mono font-black text-rose-400 mb-6">{score}</p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-rose-950 transition-all transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Floating Pause Indicator */}
        {!isPaused && !gameOver && (
          <button
            onClick={() => setIsPaused(true)}
            className="absolute top-3 right-3 bg-gray-900/60 hover:bg-gray-900 border border-gray-700/50 hover:border-gray-500 p-1.5 rounded-md text-gray-300 transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Controller Buttons for Mobile Devices */}
      <div className="w-full mt-4 flex flex-col items-center sm:hidden">
        <div className="flex justify-center mb-1">
          <button
            onClick={() => {
              if (directionRef.current !== "DOWN") directionRef.current = "UP";
            }}
            className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-300 active:bg-emerald-500 active:text-slate-950"
          >
            ▲
          </button>
        </div>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => {
              if (directionRef.current !== "RIGHT") directionRef.current = "LEFT";
            }}
            className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-300 active:bg-emerald-500 active:text-slate-950"
          >
            ◀
          </button>
          <button
            onClick={() => {
              if (directionRef.current !== "UP") directionRef.current = "DOWN";
            }}
            className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-300 active:bg-emerald-500 active:text-slate-950"
          >
            ▼
          </button>
          <button
            onClick={() => {
              if (directionRef.current !== "LEFT") directionRef.current = "RIGHT";
            }}
            className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-300 active:bg-emerald-500 active:text-slate-950"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Keyboard Hint */}
      <p className="text-[11px] text-gray-500 font-mono mt-4 text-center hidden sm:block">
        PRESS <span className="bg-gray-900 border border-gray-800 px-1 py-0.5 rounded text-gray-300">SPACEBAR</span> TO PAUSE/RESUME
      </p>
    </div>
  );
}
