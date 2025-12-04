import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readGrid } from "../utils/input.js";

interface GridFrame {
  grid: string[];
  action?: string;
  position?: [number, number];
  marker?: string;
}

interface GridVisualizationData {
  format: "grid-frames";
  rows: number;
  cols: number;
  frames: GridFrame[];
  palette?: Record<
    string,
    {
      bg?: string;
      fg?: string;
    }
  >;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function countNeighbors(grid: string[][], row: number, col: number): number {
  return NEIGHBORS.reduce(
    (acc, [dr, dc]) => (grid[row + dr]?.[col + dc] === "@" ? acc + 1 : acc),
    0
  );
}

function capture(
  grid: string[][],
  action?: string,
  position?: [number, number],
  marker?: string
): GridFrame {
  return {
    grid: grid.map((row) => row.join("")),
    action,
    position,
    marker,
  };
}

function buildVisualization(grid: string[][]): GridVisualizationData {
  const working = grid.map((row) => row.filter((c) => c !== "\r"));
  const queue: [number, number][] = [];
  const frames: GridFrame[] = [];

  frames.push(capture(working, "Initial grid"));

  let wave = 0;
  const palette: GridVisualizationData["palette"] = {
    "@": { bg: "#059669", fg: "#e5e7eb" },
    ".": { bg: "#111827", fg: "#6b7280" },
  };

  for (let row = 0; row < working.length; row++) {
    for (let col = 0; col < working[row].length; col++) {
      if (working[row][col] === "@" && countNeighbors(working, row, col) < 4) {
        queue.push([row, col]);
      }
    }
  }
  frames.push(capture(working, "Seeded paper rolls"));

  let currentWaveRemaining = queue.length;
  let nextWaveAdds = 0;

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    if (working[row][col] !== "@") continue;

    const marker = waveMarker(wave);
    palette[marker] = palette[marker] ?? colorForWave(wave);

    working[row][col] = marker;
    let enqueued = 0;

    for (const [dr, dc] of NEIGHBORS) {
      const nRow = row + dr;
      const nCol = col + dc;
      if (working[nRow]?.[nCol] === "@" && countNeighbors(working, nRow, nCol) < 4) {
        queue.push([nRow, nCol]);
        enqueued++;
        nextWaveAdds++;
      }
    }

    frames.push(
      capture(
        working,
        `Wave ${wave + 1}: removed paper roll (${row}, ${col})`,
        [row, col],
        marker
      )
    );

    currentWaveRemaining--;
    if (currentWaveRemaining === 0) {
      wave++;
      currentWaveRemaining = nextWaveAdds;
      nextWaveAdds = 0;
    }
  }

  return {
    format: "grid-frames",
    rows: working.length,
    cols: working[0]?.length ?? 0,
    frames,
    palette,
  };
}

function waveMarker(wave: number): string {
  const symbols = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return symbols[wave % symbols.length] ?? "*";
}

function colorForWave(wave: number): { bg: string; fg: string } {
  const hue = (wave * 47) % 360;
  return {
    bg: `hsl(${hue} 65% 22%)`,
    fg: `hsl(${hue} 70% 92%)`,
  };
}

export function generateVisualization(options?: { useExample?: boolean; filename?: string }) {
  const filename = options?.useExample ? "example.txt" : options?.filename ?? "input.txt";
  const grid = readGrid(4, filename);
  const data = buildVisualization(grid);
  const visualsDir = join(__dirname, "visuals");
  mkdirSync(visualsDir, { recursive: true });
  const outFile = join(visualsDir, "grid-fill.json");
  writeFileSync(outFile, JSON.stringify(data, null, 2));
  return { outFile, frames: data.frames.length, waves: Object.keys(data.palette ?? {}).length };
}

const NEIGHBORS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
