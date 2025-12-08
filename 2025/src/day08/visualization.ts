import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readLines } from "../utils/input.js";

interface GraphNode {
  id: number;
  x: number;
  y: number;
  z?: number; // 3D coordinate
  label?: string;
  component?: number;
}

interface GraphEdge {
  source: number;
  target: number;
  distance: number;
}

interface GraphFrame {
  nodes: GraphNode[];
  edges: GraphEdge[];
  action?: string;
  highlightEdge?: { source: number; target: number };
  highlightNodes?: number[];
}

interface GraphVisualizationData {
  format: "graph-frames";
  frames: GraphFrame[];
  palette?: Record<number, { bg: string; fg: string }>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

type Box = [number, number, number];

function distanceSqrt(a: Box, b: Box): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function createSortedPairs(
  boxes: Box[]
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

  getComponent(x: number): number {
    return this.find(x);
  }
}

function projectTo2D(boxes: Box[]): { x: number; y: number }[] {
  // Use simple MDS (Multidimensional Scaling) to project 3D to 2D
  // while preserving pairwise distances as much as possible
  const n = boxes.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: 450, y: 300 }];

  // Compute distance matrix
  const dist: number[][] = [];
  for (let i = 0; i < n; i++) {
    dist[i] = [];
    for (let j = 0; j < n; j++) {
      dist[i][j] = Math.sqrt(distanceSqrt(boxes[i], boxes[j]));
    }
  }

  // Initialize 2D positions randomly but deterministically
  const positions = boxes.map((_, i) => ({
    x: Math.cos(i * 2.39996) * 100 + Math.sin(i * 1.618) * 50,
    y: Math.sin(i * 2.39996) * 100 + Math.cos(i * 1.618) * 50,
  }));

  // Run stress minimization (simplified MDS)
  const iterations = 200;
  const learningRate = 0.1;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < n; i++) {
      let dx = 0, dy = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const px = positions[i].x - positions[j].x;
        const py = positions[i].y - positions[j].y;
        const d2d = Math.sqrt(px * px + py * py) || 0.001;
        const d3d = dist[i][j] || 0.001;
        // Move to reduce difference between 2D and 3D distance
        const scale = (d3d - d2d) / d2d;
        dx += px * scale;
        dy += py * scale;
      }
      positions[i].x += dx * learningRate / n;
      positions[i].y += dy * learningRate / n;
    }
  }

  // Normalize to fit visualization area
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y));

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return positions.map((p) => ({
    x: ((p.x - minX) / rangeX) * 800 + 50,
    y: ((p.y - minY) / rangeY) * 500 + 50,
  }));
}

function colorForComponent(component: number): { bg: string; fg: string } {
  const hue = (component * 137) % 360; // Golden angle for good distribution
  return {
    bg: `hsl(${hue} 70% 45%)`,
    fg: `hsl(${hue} 80% 95%)`,
  };
}

function normalize3DCoords(boxes: Box[]): { x: number; y: number; z: number }[] {
  // Normalize 3D coordinates to a reasonable range for visualization
  const minX = Math.min(...boxes.map((b) => b[0]));
  const maxX = Math.max(...boxes.map((b) => b[0]));
  const minY = Math.min(...boxes.map((b) => b[1]));
  const maxY = Math.max(...boxes.map((b) => b[1]));
  const minZ = Math.min(...boxes.map((b) => b[2]));
  const maxZ = Math.max(...boxes.map((b) => b[2]));

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;
  const maxRange = Math.max(rangeX, rangeY, rangeZ);

  // Center and scale to [-5, 5] range for Three.js
  return boxes.map((b) => ({
    x: ((b[0] - minX) / maxRange - 0.5) * 10,
    y: ((b[1] - minY) / maxRange - 0.5) * 10,
    z: ((b[2] - minZ) / maxRange - 0.5) * 10,
  }));
}

function buildVisualization(lines: string[]): GraphVisualizationData {
  const boxes = lines.map((line) => {
    const dimensions = line.split(",").map(Number);
    return [dimensions[0], dimensions[1], dimensions[2]] as Box;
  });

  const positions2D = projectTo2D(boxes);
  const positions3D = normalize3DCoords(boxes);
  const pairs = createSortedPairs(boxes);
  const length = boxes.length;
  const uf = new UnionFind(length);

  const frames: GraphFrame[] = [];
  const palette: Record<number, { bg: string; fg: string }> = {};
  const activeEdges: GraphEdge[] = [];

  // Initial frame: just nodes, no connections
  const initialNodes: GraphNode[] = positions2D.map((pos, i) => ({
    id: i,
    x: pos.x,
    y: pos.y,
    z: positions3D[i].z,
    label: `${i}`,
    component: i,
    // Store original 3D coords for 3D renderer
    ...{ x3d: positions3D[i].x, y3d: positions3D[i].y, z3d: positions3D[i].z },
  }));

  // Assign initial colors for each node as its own component
  for (let i = 0; i < length; i++) {
    palette[i] = colorForComponent(i);
  }

  frames.push({
    nodes: initialNodes.map((n) => ({ ...n })),
    edges: [],
    action: `Initial state: ${length} nodes, each in its own component`,
  });

  // Build connections step by step
  let components = length;

  for (let k = 0; k < pairs.length && components > 1; k++) {
    const { i, j, d } = pairs[k];

    if (uf.union(i, j)) {
      components--;

      // Add the new edge
      activeEdges.push({
        source: i,
        target: j,
        distance: Math.sqrt(d),
      });

      // Update component assignments for all nodes
      const currentNodes: GraphNode[] = positions2D.map((pos, idx) => ({
        id: idx,
        x: pos.x,
        y: pos.y,
        z: positions3D[idx].z,
        label: `${idx}`,
        component: uf.getComponent(idx),
        ...{ x3d: positions3D[idx].x, y3d: positions3D[idx].y, z3d: positions3D[idx].z },
      }));

      // Ensure palette has color for the merged component
      const newComponent = uf.getComponent(i);
      if (!palette[newComponent]) {
        palette[newComponent] = colorForComponent(newComponent);
      }

      frames.push({
        nodes: currentNodes,
        edges: activeEdges.map((e) => ({ ...e })),
        action: `Connected node ${i} ↔ ${j} (distance: ${Math.sqrt(d).toFixed(1)}). Components remaining: ${components}`,
        highlightEdge: { source: i, target: j },
        highlightNodes: [i, j],
      });
    }
  }

  // Final frame
  const finalNodes: GraphNode[] = positions2D.map((pos, idx) => ({
    id: idx,
    x: pos.x,
    y: pos.y,
    z: positions3D[idx].z,
    label: `${idx}`,
    component: uf.getComponent(idx),
    ...{ x3d: positions3D[idx].x, y3d: positions3D[idx].y, z3d: positions3D[idx].z },
  }));

  frames.push({
    nodes: finalNodes,
    edges: activeEdges.map((e) => ({ ...e })),
    action: `Complete: All nodes connected into ${components} component(s)`,
  });

  return {
    format: "graph-frames",
    frames,
    palette,
  };
}

export function generateVisualization(options?: {
  useExample?: boolean;
  filename?: string;
}) {
  const filename = options?.useExample
    ? "example.txt"
    : options?.filename ?? "input.txt";
  const lines = readLines(8, filename);
  const data = buildVisualization(lines);
  const visualsDir = join(__dirname, "visuals");
  mkdirSync(visualsDir, { recursive: true });
  const outFile = join(visualsDir, "graph-connections.json");
  writeFileSync(outFile, JSON.stringify(data, null, 2));
  return { outFile, frames: data.frames.length };
}
