import { readLines } from "../utils/input.js";
import { runDay } from "../utils/runner.js";

export const input = readLines(5);

export function part1(lines: string[]): number {
  const emptyLineIndex = lines.findIndex((line) => line.trim() === "");
  const ranges = lines.slice(0, emptyLineIndex).map((line) => {
    const [start, end] = line.split("-").map(Number);
    return { start, end };
  });
  const values = lines.slice(emptyLineIndex + 1).map(Number);

  return values.filter((num) =>
    ranges.some((range) => range.start <= num && num <= range.end)
  ).length;
}

export function part2(lines: string[]): number {
  const emptyLineIndex = lines.findIndex((line) => line.trim() === "");
  const rangeLines = lines.slice(0, emptyLineIndex);

  const ranges = rangeLines
    .map((line) => {
      const [start, end] = line.split("-").map(Number);
      return { start, end };
    })
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    let prev = merged[merged.length - 1];
    if (merged.length === 0 || prev.end < range.start - 1) {
      merged.push({ ...range });
    } else {
      prev.end = Math.max(prev.end, range.end);
    }
  }

  return merged.reduce((sum, r) => sum + (r.end - r.start + 1), 0);
}

export const solution = runDay({ day: 5, input, part1, part2 });
