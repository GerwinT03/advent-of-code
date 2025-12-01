import { readLines } from "../utils/input.js";
import { runDay } from "../utils/runner.js";

const input = readLines(1);

function part1(lines: string[]): number {
  let rotation = 50;
  let count = 0;
  lines.forEach((line) => {
    let value = parseInt(line.slice(1))
    rotation = line.startsWith("L") ? rotation - value : rotation + value;
    if (rotation % 100 == 0) count++;
  })
  return count;
}

function part2(lines: string[]): number {
  let rotation = 50;
  let count = 0;
  lines.forEach((line) => {
    let value = parseInt(line.slice(1))
    let start = rotation;
    rotation = line.startsWith("L") ? rotation - value : rotation + value;
    if (start < rotation) {
      let first = Math.ceil((start + 1) / 100) * 100;
      if (first <= rotation) count += Math.floor((rotation - first) / 100) + 1;
    } else {
      let last = Math.floor((start - 1) / 100) * 100;
      if (last >= rotation) count += Math.floor((last - rotation) / 100) + 1;
    }
  })
  return count;
}

export const solution = runDay({ day: 1, input, part1, part2 });
