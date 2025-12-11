import { readLines } from "../utils/input.js";
import { runDay } from "../utils/runner.js";

export const input = readLines(11);

export function part1(lines: string[]): number {
  const graph = new Map<string, string[]>();
  let start: string[] | undefined;

  lines.forEach((line) => {
    const parts = line.split(":");
    const name = parts[0];
    const outputs = parts[1].trim().split(" ");
    graph.set(name, outputs);
    if (name === "you") {
      start = outputs;
    }
  });

  const memo = new Map<string, number>();

  function countPaths(node: string, visiting: Set<string>): number {
    if (node === "out") {
      return 1;
    }

    if (visiting.has(node)) {
      return 0; // Cycle detection
    }

    if (memo.has(node)) {
      return memo.get(node)!;
    }

    visiting.add(node);

    const neighbors = graph.get(node) || [];
    let paths = 0;

    for (const neighbor of neighbors) {
      paths += countPaths(neighbor, visiting);
    }

    visiting.delete(node);
    memo.set(node, paths);

    return paths;
  }

  if (!start) {
    return 0;
  }

  let totalPaths = 0;
  for (const output of start) {
    totalPaths += countPaths(output, new Set<string>());
  }

  return totalPaths;
}

export function part2(lines: string[]): number {
  const graph = new Map<string, string[]>();
  let start: string[] | undefined;

  lines.forEach((line) => {
    const parts = line.split(":");
    const name = parts[0];
    const outputs = parts[1].trim().split(" ");
    graph.set(name, outputs);
    if (name === "svr") {
      start = outputs;
    }
  });

  // node -> state, count
  // state: 0 = neither, 1 = dac only, 2 = fft only, 3 = both
  const memo = new Map<string, Map<number, number>>();

  function countPaths(
    node: string,
    visiting: Set<string>,
    seenFft: boolean,
    seenDac: boolean,
  ): number {
    if (node === "out") {
      return seenFft && seenDac ? 1 : 0;
    }

    if (visiting.has(node)) {
      return 0; // Cycle detection
    }

    const state = (seenFft ? 2 : 0) + (seenDac ? 1 : 0);

    const nodeCache = memo.get(node);
    if (nodeCache?.has(state)) {
      return nodeCache.get(state)!;
    }

    visiting.add(node);

    const newSeenFft = seenFft || node === "fft";
    const newSeenDac = seenDac || node === "dac";

    const neighbors = graph.get(node) || [];
    let paths = 0;

    for (const neighbor of neighbors) {
      paths += countPaths(neighbor, visiting, newSeenFft, newSeenDac);
    }

    visiting.delete(node);

    if (!nodeCache) {
      memo.set(node, new Map([[state, paths]]));
    } else {
      nodeCache.set(state, paths);
    }

    return paths;
  }

  if (!start) {
    return 0;
  }

  let totalPaths = 0;
  for (const output of start) {
    totalPaths += countPaths(output, new Set<string>(), false, false);
  }

  return totalPaths;
}

export const solution = runDay({ day: 11, input, part1, part2 });
