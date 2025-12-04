import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getYearConfig } from "@/lib/config";
import { VisualizationMeta } from "@/lib/solutions";

interface RouteParams {
  params: Promise<{ year: string; day: string; viz: string }>;
}

function getDayDir(srcDir: string, day: number, yearConfig: { year: number; filePattern: "ts" | "csharp" }) {
  const dayStr = day.toString().padStart(2, "0");
  if (yearConfig.filePattern === "csharp") {
    return path.join(srcDir, `AoC${yearConfig.year}.Day${dayStr}`);
  }
  return path.join(srcDir, `day${dayStr}`);
}

function resolveVisualizationFile(dayDir: string, meta: VisualizationMeta[], vizId: string) {
  const entry = meta.find((v) => v.id === vizId);
  if (!entry) return null;

  const filePath = path.resolve(dayDir, entry.file);
  if (!filePath.startsWith(path.resolve(dayDir))) {
    return null;
  }
  return filePath;
}

function guessContentType(ext: string): string {
  switch (ext) {
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function GET(_: Request, context: RouteParams) {
  const { year, day, viz } = await context.params;
  const yearNum = Number(year);
  const dayNum = Number(day);

  const yearConfig = getYearConfig(yearNum);
  if (!yearConfig || Number.isNaN(dayNum) || dayNum < 1 || dayNum > yearConfig.totalDays) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const srcDir = path.join(process.cwd(), yearConfig.srcPath);
  const dayDir = getDayDir(srcDir, dayNum, yearConfig);
  const metaPath = path.join(dayDir, "meta.json");

  if (!fs.existsSync(metaPath)) {
    return NextResponse.json({ error: "No metadata for day" }, { status: 404 });
  }

  let meta: { visualizations?: VisualizationMeta[] };
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return NextResponse.json({ error: "Invalid metadata" }, { status: 500 });
  }

  const vizFile = resolveVisualizationFile(dayDir, meta.visualizations ?? [], viz);
  if (!vizFile || !fs.existsSync(vizFile)) {
    return NextResponse.json({ error: "Visualization not found" }, { status: 404 });
  }

  const ext = path.extname(vizFile).toLowerCase();
  const contentType = guessContentType(ext);

  if (ext === ".json") {
    const data = fs.readFileSync(vizFile, "utf-8");
    return new NextResponse(data, {
      status: 200,
      headers: { "content-type": contentType },
    });
  }

  const data = fs.readFileSync(vizFile);
  return new NextResponse(data, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
