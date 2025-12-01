import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import {
  type DayResult,
  printDay,
  printFooter,
  printHeader,
} from "./utils/runner.js";

const args = process.argv.slice(2);
const dayArgs = args.filter((arg) => !arg.startsWith("--"));

if (dayArgs.length === 0) {
  console.error("Usage: bun run day <day|day-day|day,day,...> [--example]");
  console.error("Examples:");
  console.error("  bun run day 1");
  console.error("  bun run day 1-5");
  console.error("  bun run day 1,3,5");
  process.exit(1);
}

function parseDays(input: string): number[] {
  const days: number[] = [];

  for (const part of input.split(",")) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (isNaN(start) || isNaN(end) || start < 1 || end > 12 || start > end) {
        console.error(`Invalid range: ${part}`);
        process.exit(1);
      }
      for (let i = start; i <= end; i++) {
        days.push(i);
      }
    } else {
      const day = parseInt(part, 10);
      if (isNaN(day) || day < 1 || day > 12) {
        console.error(`Invalid day: ${part}`);
        process.exit(1);
      }
      days.push(day);
    }
  }

  return [...new Set(days)].sort((a, b) => a - b);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const days = parseDays(dayArgs.join(","));

// Filter to only existing days
const validDays = days.filter((day) => {
  const dayFolder = `day${day.toString().padStart(2, "0")}`;
  const dayFile = join(__dirname, dayFolder, "index.ts");
  if (!existsSync(dayFile)) {
    console.error(`Day ${day} does not exist, skipping...`);
    return false;
  }
  return true;
});

if (validDays.length === 0) {
  console.error("No valid days to run");
  process.exit(1);
}

// Run all days and collect results
const results: DayResult[] = [];

for (const day of validDays) {
  const dayFolder = `day${day.toString().padStart(2, "0")}`;
  const dayFile = join(__dirname, dayFolder, "index.ts");
  const fileUrl = pathToFileURL(dayFile).href;

  const module = await import(fileUrl);
  if (module.solution) {
    results.push(module.solution);
  }
}

// Print unified output
printHeader(results.length);
for (const result of results) {
  printDay(result);
}
printFooter(results);
