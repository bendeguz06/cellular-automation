import { useState, useEffect } from "react";
import "./index.css";

export function App() {
  const row = 100;
  const col = 100;
  const [grid, setGrid] = useState(
    Array(row)
      .fill(null)
      .map(() => Array(col).fill(0)),
  );
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
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Fixed: Move inside App(), proper syntax
    if (!run) return;
    const id = setInterval(() => {
      setGrid((old) => computeNext(old, row, col)); // Define computeNext separately
    }, 100);
    return () => clearInterval(id);
  }, [run]); // Fixed: Deps array as 2nd arg

  return <div>Cellular Automation</div>; // Add return JSX
}

export default App;
