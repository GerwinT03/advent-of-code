"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { VisualizationMeta } from "@/lib/solutions";
import { Loader2, Pause, Play, RotateCw, StepForward, Box, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Graph3DRenderer } from "./Graph3DRenderer";

interface GridFrame {
  marker: string;
  grid: string[];
  action?: string;
  position?: [number, number];
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

interface GraphNode {
  id: number;
  x: number;
  y: number;
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

type SupportedVisualization = GridVisualizationData | GraphVisualizationData;

interface Props {
  year: number;
  day: number;
  visualization: VisualizationMeta;
}

export function VisualizationPlayer({ year, day, visualization }: Props) {
  const [data, setData] = useState<SupportedVisualization | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60); // 0-100, higher is faster
  const [error, setError] = useState<string | null>(null);
  const [view3D, setView3D] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setIsPlaying(false);
    setFrameIndex(0);
    fetch(`/api/visuals/${year}/${day}/${visualization.id}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        if ((payload.format !== "grid-frames" && payload.format !== "graph-frames") || !payload.frames) {
          throw new Error("Unsupported visualization format");
        }
        setData(payload as SupportedVisualization);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [year, day, visualization.id]);

  const delayMs = useMemo(() => {
    const minDelay = 120;
    const maxDelay = 1200;
    const clamped = Math.min(100, Math.max(0, speed));
    return Math.round(maxDelay - (clamped / 100) * (maxDelay - minDelay));
  }, [speed]);

  useEffect(() => {
    if (!data || !isPlaying) return;
    const id = window.setInterval(() => {
      setFrameIndex((idx) => (idx + 1) % data.frames.length);
    }, delayMs);
    return () => window.clearInterval(id);
  }, [data, isPlaying, delayMs]);

  const totalFrames = data?.frames.length ?? 0;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-400">{visualization.title || "Visualization"}</p>
          {visualization.description && <p className="text-xs text-gray-500">{visualization.description}</p>}
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {!data && !error && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading visualization…
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <button
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              onClick={() => setFrameIndex((idx) => (idx + 1) % totalFrames)}
              aria-label="Step forward"
            >
              <StepForward className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              onClick={() => {
                setFrameIndex(0);
                setIsPlaying(false);
              }}
              aria-label="Reset"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 ml-4 text-xs text-gray-400">
              <span>Speed</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <span>{delayMs}ms delay</span>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
              {data.format === "graph-frames" && (
                <button
                  onClick={() => setView3D((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-md transition-all duration-200 font-medium",
                    "border border-gray-700 shadow-sm",
                    view3D 
                      ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/20 shadow-md hover:bg-blue-700" 
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600"
                  )}
                  title={view3D ? "Switch to 2D view" : "Switch to 3D view"}
                >
                  {view3D ? <Box className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  <span className="text-xs">{view3D ? "3D" : "2D"}</span>
                </button>
              )}
              <span>Frame {frameIndex + 1} / {totalFrames}</span>
            </div>
          </div>

          {data.format === "grid-frames" ? (
            <GridRenderer data={data} frameIndex={frameIndex} />
          ) : view3D ? (
            <div key="3d-view">
              <Graph3DRenderer data={data} frameIndex={frameIndex} />
            </div>
          ) : (
            <GraphRenderer data={data} frameIndex={frameIndex} />
          )}
        </>
      )}

      {error && (
        <p className="text-sm text-gray-400">
          Unable to load visualization. The file might be missing or in an unsupported format.
        </p>
      )}
    </div>
  );
}

// Grid Renderer Component
function GridRenderer({ data, frameIndex }: { data: GridVisualizationData; frameIndex: number }) {
  const frame = data.frames[frameIndex];
  const palette = data.palette ?? {};

  const cells = useMemo(() => {
    if (!frame) return [];
    const rows = frame.grid.map((line) => line.split(""));
    const maxCols = rows.reduce((m, row) => Math.max(m, row.length), 0);
    return rows.map((row) => {
      if (row.length === maxCols) return row;
      return [...row, ...Array.from({ length: maxCols - row.length }, () => "")];
    });
  }, [frame]);

  const maxCols = useMemo(() => (cells.length ? cells[0].length : 0), [cells]);

  if (!frame) return null;

  return (
    <>
      <div
        className="grid gap-1 bg-gray-950 p-3 rounded-lg border border-gray-800"
        style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
      >
        {cells.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={cn(
                "aspect-square rounded-sm text-center text-xs font-mono flex items-center justify-center border border-gray-900/40",
                highlightClass(frame.position, rIdx, cIdx)
              )}
              style={cellStyle(cell, palette)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      {frame.action && (
        <div className="mt-2 text-xs text-gray-300 space-y-1">
          <p className="flex items-center gap-2">
            {frame.marker && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-sm border border-gray-800 text-[10px] font-mono"
                style={cellStyle(frame.marker, palette)}
              >
                {frame.marker}
              </span>
            )}
            {frame.action}
          </p>
        </div>
      )}
    </>
  );
}

// Graph Renderer Component
function GraphRenderer({ data, frameIndex }: { data: GraphVisualizationData; frameIndex: number }) {
  const frame = data.frames[frameIndex];
  const palette = data.palette ?? {};
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate bounds for SVG viewBox
  const baseBounds = useMemo(() => {
    if (!frame) return { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 };
    const allX = frame.nodes.map((n) => n.x);
    const allY = frame.nodes.map((n) => n.y);
    const padding = 50;
    const minX = Math.min(...allX) - padding;
    const maxX = Math.max(...allX) + padding;
    const minY = Math.min(...allY) - padding;
    const maxY = Math.max(...allY) + padding;
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }, [frame?.nodes]);

  // Apply zoom and pan to bounds
  const bounds = useMemo(() => {
    const centerX = baseBounds.minX + baseBounds.width / 2;
    const centerY = baseBounds.minY + baseBounds.height / 2;
    const newWidth = baseBounds.width / zoom;
    const newHeight = baseBounds.height / zoom;
    return {
      minX: centerX - newWidth / 2 + pan.x,
      minY: centerY - newHeight / 2 + pan.y,
      width: newWidth,
      height: newHeight,
    };
  }, [baseBounds, zoom, pan]);

  const nodeMap = useMemo(() => {
    if (!frame) return new Map<number, GraphNode>();
    const map = new Map<number, GraphNode>();
    frame.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [frame?.nodes]);

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    // Convert pixel movement to SVG coordinate movement
    const scaleX = bounds.width / rect.width;
    const scaleY = bounds.height / rect.height;
    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;
    setPan((p) => ({ x: p.x - dx, y: p.y - dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!frame) return null;

  const getNodeColor = (node: GraphNode) => {
    const component = node.component ?? node.id;
    if (palette[component]) {
      return palette[component].bg;
    }
    const hue = (component * 137) % 360;
    return `hsl(${hue} 70% 45%)`;
  };

  const isHighlightedNode = (nodeId: number) => {
    return frame.highlightNodes?.includes(nodeId) ?? false;
  };

  const isHighlightedEdge = (source: number, target: number) => {
    if (!frame.highlightEdge) return false;
    return (
      (frame.highlightEdge.source === source && frame.highlightEdge.target === target) ||
      (frame.highlightEdge.source === target && frame.highlightEdge.target === source)
    );
  };

  // Scale sizes based on zoom (keep visual size consistent)
  const nodeRadius = 24 / zoom;
  const highlightedNodeRadius = 32 / zoom;
  const fontSize = 14 / zoom;
  const strokeWidth = 3 / zoom;
  const highlightStrokeWidth = 5 / zoom;
  const edgeStrokeWidth = 2.5 / zoom;
  const highlightEdgeStrokeWidth = 5 / zoom;

  return (
    <>
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>Zoom</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24"
          />
          <span>{zoom.toFixed(1)}x</span>
        </div>
        <button
          onClick={resetView}
          className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Reset View
        </button>
        <span className="text-gray-500">Drag to pan</span>
      </div>
      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
        <svg
          ref={svgRef}
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          className={cn("w-full h-[400px]", isDragging ? "cursor-grabbing" : "cursor-grab")}
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Edges */}
          {frame.edges.map((edge, idx) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;
            const highlighted = isHighlightedEdge(edge.source, edge.target);
            return (
              <line
                key={`edge-${idx}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={highlighted ? "#fbbf24" : "#6b7280"}
                strokeWidth={highlighted ? highlightEdgeStrokeWidth : edgeStrokeWidth}
                opacity={highlighted ? 1 : 0.7}
              />
            );
          })}

          {/* Nodes */}
          {frame.nodes.map((node) => {
            const highlighted = isHighlightedNode(node.id);
            return (
              <g key={`node-${node.id}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={highlighted ? highlightedNodeRadius : nodeRadius}
                  fill={getNodeColor(node)}
                  stroke={highlighted ? "#fbbf24" : "#374151"}
                  strokeWidth={highlighted ? highlightStrokeWidth : strokeWidth}
                />
                {node.label && (
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {frame.action && (
        <div className="mt-2 text-xs text-gray-300">
          <p>{frame.action}</p>
        </div>
      )}
    </>
  );
}

function highlightClass(highlight: [number, number] | undefined, r: number, c: number) {
  const isHighlight = highlight && highlight[0] === r && highlight[1] === c;
  return isHighlight ? "ring-2 ring-amber-400" : "";
}

function cellStyle(value: string, palette: GridVisualizationData["palette"]): CSSProperties {
  const entry = palette?.[value];
  if (entry) {
    return {
      backgroundColor: entry.bg ?? undefined,
      color: entry.fg ?? undefined,
    };
  }
  // Deterministic fallback colors per character
  const hash = value.charCodeAt(0);
  const hue = (hash * 47) % 360;
  return {
    backgroundColor: `hsl(${hue} 30% 18%)`,
    color: `hsl(${hue} 30% 88%)`,
  };
}
