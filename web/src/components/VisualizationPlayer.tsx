"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { VisualizationMeta } from "@/lib/solutions";
import { Loader2, Pause, Play, RotateCw, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";

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

type SupportedVisualization = GridVisualizationData;

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
        if (payload.format !== "grid-frames" || !payload.frames) {
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

  const frame = data?.frames[frameIndex];
  const totalFrames = data?.frames.length ?? 0;

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

  const palette = data?.palette ?? {};

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

      {data && frame && (
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
            <div className="ml-auto text-xs text-gray-400">
              Frame {frameIndex + 1} / {totalFrames}
            </div>
          </div>

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
      )}

      {error && (
        <p className="text-sm text-gray-400">
          Unable to load visualization. The file might be missing or in an unsupported format.
        </p>
      )}
    </div>
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
