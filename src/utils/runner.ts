type SolutionFn<T> = (input: T) => unknown;

interface RunOptions<T> {
  day: number;
  input: T;
  part1: SolutionFn<T>;
  part2?: SolutionFn<T>;
}

export interface DayResult {
  day: number;
  part1: { result: unknown; time: number };
  part2?: { result: unknown; time: number };
  totalTime: number;
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function formatTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

function runPart<T>(
  name: string,
  fn: SolutionFn<T>,
  input: T
): { result: unknown; time: number } {
  const start = performance.now();
  const result = fn(input);
  const time = performance.now() - start;
  return { result, time };
}

/**
 * Runs the solution for a given day and returns results (for multi-day runner)
 */
export function runDay<T>(options: RunOptions<T>): DayResult {
  const { day, input, part1, part2 } = options;

  const p1 = runPart("Part 1", part1, input);
  let totalTime = p1.time;

  let p2: { result: unknown; time: number } | undefined;
  if (part2) {
    p2 = runPart("Part 2", part2, input);
    totalTime += p2.time;
  }

  return { day, part1: p1, part2: p2, totalTime };
}

/**
 * Prints a single day's results
 */
export function printDay(result: DayResult): void {
  const dayStr = result.day.toString().padStart(2, "0");

  console.log(
    `${colors.cyan}${colors.bright}📅 Day ${dayStr}${colors.reset}`
  );
  console.log(
    `   ${colors.green}★ Part 1:${colors.reset} ${colors.bright}${result.part1.result}${colors.reset} ${colors.gray}(${formatTime(result.part1.time)})${colors.reset}`
  );
  if (result.part2) {
    console.log(
      `   ${colors.yellow}★ Part 2:${colors.reset} ${colors.bright}${result.part2.result}${colors.reset} ${colors.gray}(${formatTime(result.part2.time)})${colors.reset}`
    );
  }
}

/**
 * Prints the summary header
 */
export function printHeader(dayCount: number): void {
  console.log();
  console.log(
    `${colors.cyan}${colors.bright}✨ Advent of Code 2025${colors.reset} ${colors.dim}(${dayCount} day${dayCount > 1 ? "s" : ""})${colors.reset}`
  );
  console.log(`${colors.gray}${"─".repeat(45)}${colors.reset}`);
}

/**
 * Prints the summary footer with total time
 */
export function printFooter(results: DayResult[]): void {
  const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
  console.log(`${colors.gray}${"─".repeat(45)}${colors.reset}`);
  console.log(
    `${colors.magenta}${colors.bright}⏱  Total:${colors.reset} ${formatTime(totalTime)}`
  );
  console.log();
}

/**
 * Runs the solution for a given day with timing and formatted output (standalone mode)
 */
export function run<T>(options: RunOptions<T>): DayResult {
  const result = runDay(options);
  printHeader(1);
  printDay(result);
  printFooter([result]);
  return result;
}
