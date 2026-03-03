import { useState, useEffect } from "react";
import "./index.css";

export function App() {
  const ROW = 100;
  const COL = 100;
  const CELL_SIZE = 8;

  const [grid, setGrid] = useState(
    Array(ROW)
      .fill(null)
      .map(() => Array(COL).fill(0)),
  );
  const [run, setRun] = useState(false);
  const [fps, setFps] = useState(10);

  function computeNext(
    oldGrid: number[][],
    row: number,
    col: number,
  ): number[][] {
    const newGrid = oldGrid.map((row) => [...row]);
    for (let i = 0; i < row; i++) {
      for (let j = 0; j < col; j++) {
        var neighbours = countNeighbour(oldGrid, i, j, row, col);
        var cell = oldGrid[i]![j]!;
        if (cell === 0) {
          if (neighbours === 3) {
            newGrid[i]![j]! = 1;
          } else continue;
        } else if (cell === 1) {
          if (neighbours === 2 || neighbours === 3) {
            continue;
          } else if (neighbours < 2 || neighbours > 3) {
            newGrid[i]![j]! = 0;
          }
        } else {
          console.log("Ayyo what the helly is going on??");
        }
      }
    }
    return newGrid;
  }

  function countNeighbour(
    grid: number[][],
    i: number,
    j: number,
    row: number,
    col: number,
  ): number {
    var neighbours = 0;

    for (let di = i - 1; di <= i + 1; di++) {
      for (let dj = j - 1; dj <= j + 1; dj++) {
        if (di === i && dj === j) continue;
        if (di >= 0 && di < row && dj >= 0 && dj < col) {
          neighbours += grid[di]![dj]!;
        }
      }
    }

    return neighbours;
  }

  useEffect(() => {
    if (!run) return;
    const interval = 1000 / fps;
    const id = setInterval(() => {
      setGrid((old) => computeNext(old, ROW, COL));
    }, interval);
    return () => clearInterval(id);
  }, [run, fps]);

  const handleCellClick = (row: number, col: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r]);
      newGrid[row]![col]! = newGrid[row]![col]! === 0 ? 1 : 0;
      return newGrid;
    });
  };

  const handleFpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
    setFps(value);
  };

  const handleReset = () => {
    setRun(false);
    setGrid(
      Array(ROW)
        .fill(null)
        .map(() => Array(COL).fill(0)),
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Conway's Game of Life</h1>
      
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={() => setRun(!run)}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: run ? "#ff6b6b" : "#51cf66",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {run ? "Stop" : "Start"}
        </button>
        
        <button
          onClick={handleReset}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#4c6ef5",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          FPS:
          <input
            type="number"
            value={fps}
            onChange={handleFpsChange}
            min="1"
            max="60"
            style={{
              padding: "5px",
              fontSize: "14px",
              width: "60px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>

      <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
        Click on cells to toggle them alive/dead
      </p>

      <div
        style={{
          display: "inline-block",
          border: "2px solid #333",
          backgroundColor: "#fff",
        }}
      >
        {grid.map((row, i) => (
          <div key={i} style={{ display: "flex" }}>
            {row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                onClick={() => handleCellClick(i, j)}
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  backgroundColor: cell === 1 ? "#000" : "#fff",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                  transition: "background-color 0.1s",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
