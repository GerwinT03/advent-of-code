import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const useExample = process.argv.includes("--example");

function getFilename(filename?: string): string {
  if (filename) return filename;
  return useExample ? "example.txt" : "input.txt";
}

/**
 * Reads the input file for a given day
 * @param day - Day number
 * @param filename - Optional filename, auto-detects based on --example flag
 */
export function readInput(day: number, filename?: string): string {
  const file = getFilename(filename);
  const dayFolder = `day${day.toString().padStart(2, "0")}`;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, "..", dayFolder, file);
  return readFileSync(filePath, "utf-8").trimEnd();
}

/**
 * Reads input and splits by newlines
 */
export function readLines(day: number, filename?: string): string[] {
  return readInput(day, filename).split("\n");
}

/**
 * Reads input and parses each line as a number
 */
export function readNumbers(day: number, filename?: string): number[] {
  return readLines(day, filename).map(Number);
}

/**
 * Reads input and splits by double newlines (paragraph blocks)
 */
export function readBlocks(day: number, filename?: string): string[] {
  return readInput(day, filename).split("\n\n");
}

/**
 * Reads input as a 2D grid of characters
 */
export function readGrid(day: number, filename?: string): string[][] {
  return readLines(day, filename).map((line) => line.split(""));
}
