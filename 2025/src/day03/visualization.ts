import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readLines } from "../utils/input.js";

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

function buildVisualization(lines: string[]): GridVisualizationData {
  const keepCount = 12;
  const digitLines = lines.map((line) => line.trimEnd().split(""));
  const cols = Math.max(
    keepCount,
    ...digitLines.map((row) => row.length)
  );

  const resultRows = digitLines.map(() => Array.from({ length: keepCount }, () => "."));
  const rangeRows = digitLines.map(() => Array.from({ length: cols }, () => "."));

  const renderRows = () => {
    const rows: string[] = [];
    for (let i = 0; i < digitLines.length; i++) {
      const digitsPadded = digitLines[i].join("").padEnd(cols, ".");
      const resultPadded = resultRows[i].join("");
      rows.push(digitsPadded, rangeRows[i].join(""), resultPadded);
    }
    return rows;
  };
  const frames: GridFrame[] = [];

  const palette: GridVisualizationData["palette"] = {
    ".": { bg: "#111827", fg: "#6b7280" },
    "^": { bg: "#3b82f6", fg: "#0b111d" },
  };

  frames.push({
    grid: renderRows(),
    action: "Initial digits",
  });

  for (let lineIdx = 0; lineIdx < digitLines.length; lineIdx++) {
    let searchStart = 0;
    const digits = digitLines[lineIdx];
    const lineMarker = ((lineIdx + 1) % 10).toString(); // 1-9, 0 for 10th, etc.
    palette[lineMarker] = palette[lineMarker] ?? colorForLine(lineIdx);

    frames.push({
      grid: renderRows(),
      action: `Line ${lineIdx + 1}: start`,
    });

    for (let pick = 0; pick < keepCount; pick++) {
      const maxSearchIndex = digits.length - (keepCount - pick);
      const { value, index } = getHighestInRange(digits, searchStart, maxSearchIndex);
      resultRows[lineIdx][pick] = value;

      // Update range overlay
      rangeRows[lineIdx].fill(".");
      for (let c = searchStart; c <= maxSearchIndex; c++) {
        rangeRows[lineIdx][c] = "^";
      }

      frames.push({
        grid: renderRows(),
        action: `Line ${lineIdx + 1} pick #${pick + 1}: ${value} (index range ${searchStart}-${maxSearchIndex})`,
        position: [lineIdx * 3, index],
        marker: lineMarker,
      });

      searchStart = index + 1;
    }
  }

  return {
    format: "grid-frames",
    rows: frames[0]?.grid.length ?? 0,
    cols,
    frames,
    palette,
  };
}

function getHighestInRange(digits: string[], startIndex: number, endIndex: number): { value: string; index: number } {
  let highest = "-1";
  let index = -1;

  for (let i = startIndex; i <= endIndex; i++) {
    const value = digits[i];
    if (value > highest) {
      highest = value;
      index = i;
    }
  }

  return { value: highest, index };
}

function colorForLine(line: number): { bg: string; fg: string } {
  const hue = (line * 53) % 360;
  return {
    bg: `hsl(${hue} 65% 22%)`,
    fg: `hsl(${hue} 70% 92%)`,
  };
}

export function generateVisualization(options?: { useExample?: boolean; filename?: string }) {
  const filename = options?.useExample ? "example.txt" : options?.filename ?? "input.txt";
  const lines = readLines(3, filename);
  const data = buildVisualization(lines);
  const visualsDir = join(__dirname, "visuals");
  mkdirSync(visualsDir, { recursive: true });
  const outFile = join(visualsDir, "greedy-pick.json");
  writeFileSync(outFile, JSON.stringify(data, null, 2));
  return { outFile, frames: data.frames.length };
}
