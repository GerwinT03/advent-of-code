import { readLines } from "../utils/input.js";
import { runDay } from "../utils/runner.js";

export const input = readLines(8);

export function part1(lines: string[]): number {
  const boxes = lines.map((line) => {
    const dimensions = line.split(",").map(Number);
    return [dimensions[0], dimensions[1], dimensions[2]] as Box;
  });

  const pairs = createSortedPairs(boxes);

  const length = boxes.length;
  const uf = new UnionFind(length);

  let connections = 0;
  const maxConnections = Math.min(1000, length / 2);
  for (let k = 0; k < pairs.length && connections < maxConnections; k++) {
    const { i, j } = pairs[k];
    uf.union(i, j);
    connections++;
  }

  const circuitSizes = new Map<number, number>();
  for (let i = 0; i < length; i++) {
    const r = uf.find(i);
    circuitSizes.set(r, (circuitSizes.get(r) ?? 0) + 1);
  }

  const sizes = Array.from(circuitSizes.values()).sort((a, b) => b - a);
  return sizes[0] * sizes[1] * sizes[2];
}

export function part2(lines: string[]): number {
  const boxes = lines.map((line) => {
    const dimensions = line.split(",").map(Number);
    return [dimensions[0], dimensions[1], dimensions[2]] as Box;
  });

  const pairs = createSortedPairs(boxes);

  const length = boxes.length;
  const uf = new UnionFind(length);

  let components = length;
  let result = 0;
  for (let k = 0; k < pairs.length && components > 1; k++) {
    const { i, j } = pairs[k];
    if (uf.union(i, j)) {
      components--;
      if (components === 1) {
        result = boxes[i][0] * boxes[j][0];
      }
    }
  }
  return result;
}

export const solution = runDay({ day: 8, input, part1, part2 });

function createSortedPairs(
  boxes: Box[],
): Array<{ i: number; j: number; d: number }> {
  const pairs: Array<{ i: number; j: number; d: number }> = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      pairs.push({ i, j, d: distanceSqrt(boxes[i], boxes[j]) });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  return pairs;
}

class UnionFind {
  parent: number[];
  size: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[ra] < this.size[rb]) {
      [ra, rb] = [rb, ra];
    }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }
}

type Box = [number, number, number];

function distanceSqrt(a: Box, b: Box): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
