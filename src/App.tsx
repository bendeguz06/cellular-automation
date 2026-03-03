import { useState, useEffect, useRef } from "react";
import "./index.css";

export function App() {
  const [rows, setRows] = useState(100);
  const [cols, setCols] = useState(100);
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 800;
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef(
    Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(0)),
  );
  const historyRef = useRef<number[][][]>([]);
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<[number, number] | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(10);
  const [isErasing, setIsErasing] = useState(false);

  // Calculate effective cell size based on grid dimensions, canvas size, and zoom
  const getEffectiveCellSize = (): number => {
    const cellsizeWidth = CANVAS_WIDTH / cols;
    const cellsizeHeight = CANVAS_HEIGHT / rows;
    const baseSize = Math.min(cellsizeWidth, cellsizeHeight);
    return baseSize * zoom;
  };

  // Calculate centered offset when zoomed out
  const getAutoOffset = (): { x: number; y: number } => {
    const cellSize = getEffectiveCellSize();
    const totalWidth = cols * cellSize;
    const totalHeight = rows * cellSize;

    let x = 0;
    let y = 0;

    if (totalWidth < CANVAS_WIDTH) {
      x = (CANVAS_WIDTH - totalWidth) / 2;
    }
    if (totalHeight < CANVAS_HEIGHT) {
      y = (CANVAS_HEIGHT - totalHeight) / 2;
    }

    return { x, y };
  };

  // Optimized neighbor counting
  const countNeighbors = (
    grid: number[][],
    row: number,
    col: number,
  ): number => {
    let count = 0;
    for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
      for (
        let j = Math.max(0, col - 1);
        j <= Math.min(cols - 1, col + 1);
        j++
      ) {
        if (i !== row || j !== col) {
          count += grid[i]![j]!;
        }
      }
    }
    return count;
  };

  // Optimized Game of Life logic
  const computeNextGen = (): void => {
    const oldGrid = gridRef.current;
    const newGrid = oldGrid.map((row) => [...row]);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const neighbors = countNeighbors(oldGrid, i, j);
        const cell = oldGrid[i]![j]!;

        if (cell === 1 && (neighbors === 2 || neighbors === 3)) {
          newGrid[i]![j] = 1;
        } else if (cell === 0 && neighbors === 3) {
          newGrid[i]![j] = 1;
        } else {
          newGrid[i]![j] = 0;
        }
      }
    }

    gridRef.current = newGrid;
    drawGrid();
  };

  const saveToHistory = (): void => {
    historyRef.current.push(gridRef.current.map((row) => [...row]));
  };

  const drawGrid = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = getEffectiveCellSize();
    const autoOffset = getAutoOffset();
    const finalOffsetX = offsetX + autoOffset.x;
    const finalOffsetY = offsetY + autoOffset.y;

    // Clear canvas with black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw alive cells in yellowish-green
    ctx.fillStyle = "#F8FF99";
    const grid = gridRef.current;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i]![j] === 1) {
          ctx.fillRect(
            j * cellSize + finalOffsetX,
            i * cellSize + finalOffsetY,
            cellSize,
            cellSize,
          );
        }
      }
    }
  };

  const toggleCell = (row: number, col: number): void => {
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      if (isErasing) {
        gridRef.current[row]![col] = 0;
      } else {
        gridRef.current[row]![col] = gridRef.current[row]![col] === 0 ? 1 : 0;
      }
      drawGrid();
    }
  };

  const getCellCoords = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = getEffectiveCellSize();
    const autoOffset = getAutoOffset();
    const finalOffsetX = offsetX + autoOffset.x;
    const finalOffsetY = offsetY + autoOffset.y;

    const col = Math.floor((x - finalOffsetX) / cellSize);
    const row = Math.floor((y - finalOffsetY) / cellSize);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return null;
    }

    return [row, col];
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    lastCellRef.current = null;
    const coords = getCellCoords(e);
    if (coords) {
      toggleCell(coords[0], coords[1]);
      lastCellRef.current = coords;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getCellCoords(e);
    if (coords && (!lastCellRef.current || lastCellRef.current[0] !== coords[0] || lastCellRef.current[1] !== coords[1])) {
      toggleCell(coords[0], coords[1]);
      lastCellRef.current = coords;
    }
  };

  const handleCanvasMouseUp = () => {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellSize = getEffectiveCellSize();
    const autoOffset = getAutoOffset();
    const finalOffsetX = offsetX + autoOffset.x;
    const finalOffsetY = offsetY + autoOffset.y;

    // Convert mouse position to grid coordinates
    const gridX = (mouseX - finalOffsetX) / cellSize;
    const gridY = (mouseY - finalOffsetY) / cellSize;

    // Calculate new zoom
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    const zoomChange = newZoom / zoom;

    // Calculate new cell size with new zoom
    const newCellSize = getEffectiveCellSize() * zoomChange;

    // Adjust offset so the grid coordinate under cursor stays at mouse position
    const newOffsetX = mouseX - gridX * newCellSize;
    const newOffsetY = mouseY - gridY * newCellSize;

    setZoom(newZoom);
    setOffsetX(newOffsetX - getAutoOffset().x);
    setOffsetY(newOffsetY - getAutoOffset().y);
  };

  const handleFpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
    setFps(value);
  };

  const handleReset = () => {
    setIsRunning(false);
    gridRef.current = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(0));
    historyRef.current = [];
    drawGrid();
  };

  const handleRevert = () => {
    if (historyRef.current.length > 0) {
      gridRef.current = historyRef.current.pop()!;
      drawGrid();
    }
  };

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      10,
      Math.min(3000, parseInt(e.target.value) || rows),
    );
    setRows(value);
    gridRef.current = Array(value)
      .fill(null)
      .map(() => Array(cols).fill(0));
    historyRef.current = [];
  };

  const handleColChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      10,
      Math.min(3000, parseInt(e.target.value) || cols),
    );
    setCols(value);
    gridRef.current = Array(rows)
      .fill(null)
      .map(() => Array(value).fill(0));
    historyRef.current = [];
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const moveCanvas = (dx: number, dy: number) => {
    const moveAmount = 20;
    setOffsetX((prev) => prev + dx * moveAmount);
    setOffsetY((prev) => prev + dy * moveAmount);
  };

  // Keyboard event handler for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") {
        e.preventDefault();
        moveCanvas(0, 1);
      } else if (key === "s" || key === "arrowdown") {
        e.preventDefault();
        moveCanvas(0, -1);
      } else if (key === "a" || key === "arrowleft") {
        e.preventDefault();
        moveCanvas(1, 0);
      } else if (key === "d" || key === "arrowright") {
        e.preventDefault();
        moveCanvas(-1, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize and redraw on grid size or zoom changes
  useEffect(() => {
    drawGrid();
  }, [rows, cols, zoom, offsetX, offsetY]);

  // Game loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = 1000 / fps;
    const id = setInterval(() => {
      saveToHistory();
      computeNextGen();
    }, interval);
    return () => clearInterval(id);
  }, [isRunning, fps, zoom, offsetX, offsetY]);

  return (
    <div
      style={{
        padding: "12px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h1 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>
        Conway's Game of Life
      </h1>

      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "14px",
        }}
      >
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            backgroundColor: isRunning
              ? "rgba(255, 107, 107, 0.8)"
              : "rgba(81, 207, 102, 0.8)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          {isRunning ? "Stop" : "Start"}
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            backgroundColor: "rgba(76, 110, 245, 0.8)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          Reset
        </button>

        <button
          onClick={handleRevert}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            backgroundColor: "rgba(156, 54, 181, 0.8)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          Revert
        </button>

        <button
          onClick={() => setIsErasing(!isErasing)}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            backgroundColor: isErasing
              ? "rgba(255, 107, 107, 0.8)"
              : "rgba(81, 207, 102, 0.8)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          Erase
        </button>

        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <button
            onClick={handleZoomOut}
            style={{
              padding: "6px 10px",
              fontSize: "12px",
              backgroundColor: "rgba(255, 152, 0, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            }}
          >
            −
          </button>
          <span
            style={{ minWidth: "40px", textAlign: "center", fontSize: "12px" }}
          >
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleZoomIn}
            style={{
              padding: "6px 10px",
              fontSize: "12px",
              backgroundColor: "rgba(255, 152, 0, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            }}
          >
            +
          </button>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          FPS:
          <input
            type="number"
            value={fps}
            onChange={handleFpsChange}
            min="1"
            max="60"
            style={{
              padding: "4px",
              fontSize: "12px",
              width: "45px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(42, 42, 42, 0.8)",
              color: "#fff",
              backdropFilter: "blur(10px)",
            }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          ROWS:
          <input
            type="number"
            value={rows}
            onChange={handleRowChange}
            min="10"
            max="3000"
            style={{
              padding: "4px",
              fontSize: "12px",
              width: "45px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(42, 42, 42, 0.8)",
              color: "#fff",
              backdropFilter: "blur(10px)",
            }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          COLUMNS:
          <input
            type="number"
            value={cols}
            onChange={handleColChange}
            min="10"
            max="3000"
            style={{
              padding: "4px",
              fontSize: "12px",
              width: "45px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(42, 42, 42, 0.8)",
              color: "#fff",
              backdropFilter: "blur(10px)",
            }}
          />
        </label>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleCanvasWheel}
        style={{
          border: "2px solid #444",
          cursor: "crosshair",
          display: "block",
          backgroundColor: "#000",
          flex: 1,
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default App;
