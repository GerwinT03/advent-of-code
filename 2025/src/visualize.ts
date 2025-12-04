import { basename } from "path";

type GenerateResult = { outFile: string; frames?: number; waves?: number };

function padDay(day: number) {
  return day.toString().padStart(2, "0");
}

async function loadGenerator(day: number): Promise<null | ((opts?: { useExample?: boolean; filename?: string }) => GenerateResult)> {
  const dayStr = padDay(day);
  try {
    const mod = await import(`./day${dayStr}/visualization.js`);
    if (typeof mod.generateVisualization === "function") {
      return mod.generateVisualization as (opts?: { useExample?: boolean; filename?: string }) => GenerateResult;
    }
    return null;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ERR_MODULE_NOT_FOUND") {
      return null;
    }
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dayArg = args.find((a) => !a.startsWith("-"));
  if (!dayArg) {
    console.error("Usage: bun run visualize <day> [--example]");
    process.exit(1);
  }

  const day = Number(dayArg);
  if (Number.isNaN(day)) {
    console.error("Day must be a number");
    process.exit(1);
  }

  const useExample = args.includes("--example");
  const generator = await loadGenerator(day);
  if (!generator) {
    console.error(`No visualization generator found for day ${padDay(day)} (expected src/day${padDay(day)}/visualization.ts)`);
    process.exit(1);
  }

  const { outFile, frames, waves } = generator({ useExample });
  console.log(
    `Visualization generated for day ${padDay(day)} -> ${basename(outFile)}${frames ? ` (${frames} frames)` : ""}${waves ? `, ${waves} markers` : ""}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
