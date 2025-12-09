import { readLines } from "../utils/input.js";
import { runDay } from "../utils/runner.js";

export const input = readLines(9);

export function part1(lines: string[]): number {
  const coords = lines.map((line) => {
    const [x, y] = line.split(",").map(Number);
    return { x, y };
  });

  let maxArea = 0;
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const distX = Math.abs(coords[i].x - coords[j].x) + 1;
      const distY = Math.abs(coords[i].y - coords[j].y) + 1;
      const area = distX * distY;
      if (area > maxArea) {
        maxArea = area;
      }
    }
  }
  return maxArea;
}

export function part2(lines: string[]): number {
  const coords = lines.map((line) => {
    const [x, y] = line.split(",").map(Number);
    return { x, y };
  });

  const uniqueXs = [...new Set(coords.map((c) => c.x))].sort((a, b) => a - b);
  const uniqueYs = [...new Set(coords.map((c) => c.y))].sort((a, b) => a - b);

  const xToIdx = new Map<number, number>();
  const yToIdx = new Map<number, number>();
  uniqueXs.forEach((x, i) => xToIdx.set(x, i));
  uniqueYs.forEach((y, i) => yToIdx.set(y, i));

  const compressedCoords = coords.map((c) => ({
    x: xToIdx.get(c.x)!,
    y: yToIdx.get(c.y)!,
    origX: c.x,
    origY: c.y,
  }));

  const width = uniqueXs.length;
  const height = uniqueYs.length;

  const grid = new Uint8Array(width * height);

  for (let i = 0; i < compressedCoords.length; i++) {
    const current = compressedCoords[i];
    const next = compressedCoords[(i + 1) % compressedCoords.length];
    const startX = Math.min(current.x, next.x);
    const endX = Math.max(current.x, next.x);
    const startY = Math.min(current.y, next.y);
    const endY = Math.max(current.y, next.y);
    for (let y = startY; y <= endY; y++) {
      const rowOffset = y * width;
      for (let x = startX; x <= endX; x++) {
        grid[rowOffset + x] = 1;
      }
    }
  }

  const buildHasX = (scanByRow: boolean, reverse: boolean): Uint8Array => {
    const result = new Uint8Array(width * height);
    const outer = scanByRow ? height : width;
    const inner = scanByRow ? width : height;

    for (let o = 0; o < outer; o++) {
      let foundX = false;
      for (let i = 0; i < inner; i++) {
        const idx = reverse ? inner - 1 - i : i;
        const pos = scanByRow ? o * width + idx : idx * width + o;
        if (grid[pos] === 1) foundX = true;
        result[pos] = foundX ? 1 : 0;
      }
    }
    return result;
  };

  const hasXLeft = buildHasX(true, false);
  const hasXRight = buildHasX(true, true);
  const hasXAbove = buildHasX(false, false);
  const hasXBelow = buildHasX(false, true);

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;
      if (
        grid[idx] === 0 &&
        hasXLeft[rowOffset + x - 1] === 1 &&
        hasXRight[rowOffset + x + 1] === 1 &&
        hasXAbove[(y - 1) * width + x] === 1 &&
        hasXBelow[(y + 1) * width + x] === 1
      ) {
        grid[idx] = 1;
      }
    }
  }

  let maxArea = 0;
  for (let i = 0; i < compressedCoords.length; i++) {
    for (let j = i + 1; j < compressedCoords.length; j++) {
      const ci = compressedCoords[i];
      const cj = compressedCoords[j];

      // Compressed coordinates for grid check
      const cx1 = Math.min(ci.x, cj.x);
      const cx2 = Math.max(ci.x, cj.x);
      const cy1 = Math.min(ci.y, cj.y);
      const cy2 = Math.max(ci.y, cj.y);

      // Original coordinates for area calculation
      const ox1 = Math.min(ci.origX, cj.origX);
      const ox2 = Math.max(ci.origX, cj.origX);
      const oy1 = Math.min(ci.origY, cj.origY);
      const oy2 = Math.max(ci.origY, cj.origY);

      const distX = ox2 - ox1 + 1;
      const distY = oy2 - oy1 + 1;
      const area = distX * distY;

      if (area <= maxArea) continue;
      let allX = true;
      outer: for (let y = cy1; y <= cy2; y++) {
        const rowOffset = y * width;
        for (let x = cx1; x <= cx2; x++) {
          if (grid[rowOffset + x] !== 1) {
            allX = false;
            break outer;
          }
        }
      }
      if (allX) {
        maxArea = area;
      }
    }
  }
  return maxArea;
}

export const solution = runDay({ day: 9, input, part1, part2 });
