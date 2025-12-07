import { readGrid } from "../utils/input.js";
import { runDay } from "../utils/runner.js";

export const input = readGrid(7);

export function part1(grid: string[][]): number {
  let startCol = grid[0].findIndex((char) => char === "S");
  let activeBeams = new Set<number>([startCol]);
  let splitCount = 0;

  for (let row = 0; row < grid.length; row++) {
    const newBeams = new Set<number>();

    for (const beamCol of activeBeams) {
      if (beamCol < 0 || beamCol >= grid[0].length) continue;

      const cell = grid[row][beamCol];

      if (cell === "^") {
        splitCount++;
        newBeams.add(beamCol - 1);
        newBeams.add(beamCol + 1);
      } else {
        grid[row][beamCol] = "|";
        newBeams.add(beamCol);
      }
    }

    activeBeams = newBeams;
  }
  return splitCount;
}

export function part2(grid: string[][]): number {
  let startCol = grid[0].findIndex((char) => char === "S");

  let beamCounts = new Map<number, number>();
  beamCounts.set(startCol, 1);

  for (let row = 0; row < grid.length; row++) {
    const newBeamCounts = new Map<number, number>();

    for (const [beamCol, count] of beamCounts) {
      if (beamCol < 0 || beamCol >= grid[0].length) continue;

      const cell = grid[row][beamCol];

      if (cell === "^") {
        const leftCol = beamCol - 1;
        const rightCol = beamCol + 1;
        newBeamCounts.set(leftCol, (newBeamCounts.get(leftCol) || 0) + count);
        newBeamCounts.set(rightCol, (newBeamCounts.get(rightCol) || 0) + count);
      } else {
        newBeamCounts.set(beamCol, (newBeamCounts.get(beamCol) || 0) + count);
      }
    }

    beamCounts = newBeamCounts;
  }
  return [...beamCounts.values()].reduce((sum, count) => sum + count, 0);
}

export const solution = runDay({ day: 7, input, part1, part2 });
