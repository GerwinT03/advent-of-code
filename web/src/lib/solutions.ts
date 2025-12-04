import fs from "fs";
import path from "path";
import { getYearConfig, defaultYear, YearConfig } from "./config";

export interface PerformanceStats {
  mean: number;
  min: number;
  max: number;
  median: number;
  runs: number;
}

export interface PerformanceData {
  part1: PerformanceStats;
  part2?: PerformanceStats;
  benchmarkedAt: string;
  runtime: string;
}

export interface VisualizationMeta {
  id: string;
  file: string;
  title?: string;
  description?: string;
  format?: string;
}

export interface DayMetadata {
  title: string;
  stars?: number;
  performance?: PerformanceData;
  visualizations?: VisualizationMeta[];
}

export interface DaySolution {
  day: number;
  title: string;
  code: string;
  completed: boolean;
  stars: number; // 0, 1, or 2
  metadata: DayMetadata | null;
  performance: PerformanceData | null;
  visualizations: VisualizationMeta[];
}

function readMetadata(metaPath: string): DayMetadata | null {
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return null;
  }
}

function getCodePath(srcDir: string, day: number, yearConfig: { year: number; filePattern: "ts" | "csharp" }): { codePath: string; metaPath: string } {
  const dayStr = day.toString().padStart(2, "0");
  
  if (yearConfig.filePattern === "csharp") {
    const dayDir = path.join(srcDir, `AoC${yearConfig.year}.Day${dayStr}`);
    return {
      codePath: path.join(dayDir, "Program.cs"),
      metaPath: path.join(dayDir, "meta.json"),
    };
  }
  
  // Default TypeScript pattern
  const dayDir = path.join(srcDir, `day${dayStr}`);
  return {
    codePath: path.join(dayDir, "index.ts"),
    metaPath: path.join(dayDir, "meta.json"),
  };
}

export function getSolutions(year: number = defaultYear): DaySolution[] {
  const yearConfig = getYearConfig(year);
  if (!yearConfig) {
    return [];
  }

  const solutions: DaySolution[] = [];
  const srcDir = path.join(process.cwd(), yearConfig.srcPath);

  for (let day = 1; day <= yearConfig.totalDays; day++) {
    const { codePath, metaPath } = getCodePath(srcDir, day, yearConfig);

    let code = "";
    let completed = false;
    let stars = 0;
    let metadata: DayMetadata | null = null;

    if (fs.existsSync(codePath)) {
      code = fs.readFileSync(codePath, "utf-8");
      completed = true;
      metadata = readMetadata(metaPath);
      stars = metadata?.stars ?? 0;
    }

    solutions.push({
      day,
      title: metadata?.title || `Day ${day}`,
      code,
      completed,
      stars,
      metadata,
      performance: metadata?.performance ?? null,
      visualizations: metadata?.visualizations ?? [],
    });
  }

  return solutions;
}

export function getSolution(day: number, year: number = defaultYear): DaySolution | null {
  const solutions = getSolutions(year);
  return solutions.find((s) => s.day === day) || null;
}
