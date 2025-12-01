import { spawn } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const dayArg = args.find((arg) => !arg.startsWith("--"));

if (!dayArg) {
  console.error("Usage: pnpm run day <day> [--example]");
  process.exit(1);
}

const day = parseInt(dayArg, 10);
if (isNaN(day) || day < 1 || day > 12) {
  console.error("Day must be a number between 1 and 12");
  process.exit(1);
}

const dayFolder = `day${day.toString().padStart(2, "0")}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const dayFile = join(__dirname, dayFolder, "index.ts");

if (!existsSync(dayFile)) {
  console.error(`Day ${day} does not exist`);
  process.exit(1);
}

const passArgs = args.filter((arg) => arg.startsWith("--"));

spawn("npx", ["tsx", dayFile, ...passArgs], {
  stdio: "inherit",
  shell: true,
});
