import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { DayCard } from "@/components/DayCard";
import { getSolutions } from "@/lib/solutions";
import { getYearConfig, getAvailableYears } from "@/lib/config";
import { Calendar } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ year: string }>;
}

export function generateStaticParams() {
  return getAvailableYears().map((year) => ({
    year: year.toString(),
  }));
}

export default async function YearPage({ params }: PageProps) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr);

  const yearConfig = getYearConfig(year);
  if (!yearConfig) {
    notFound();
  }

  const solutions = getSolutions(year);
  const totalStars = solutions.reduce((sum, s) => sum + s.stars, 0);
  const completedDays = solutions.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen">
      <Header totalStars={totalStars} year={year} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            My Solutions for{" "}
            <span className="text-aoc-green">Advent of Code {year}</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Solutions written in TypeScript. <br /> Click on any completed day to view
            the code.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                <span className="text-white font-medium">{completedDays}/{yearConfig.totalDays}</span>{" "}
                days completed
              </span>
            </div>
            <a
              href="https://github.com/GerwinT03/advent-of-code"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {solutions.map((solution) => (
            <DayCard
              key={solution.day}
              day={solution.day}
              year={year}
              title={solution.title}
              completed={solution.completed}
              stars={solution.stars}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-aoc-darker border border-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-aoc-gold mb-2">
              {totalStars}
            </div>
            <div className="text-sm text-gray-400">Total Stars</div>
          </div>
          <div className="bg-aoc-darker border border-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-aoc-green mb-2">
              {completedDays}
            </div>
            <div className="text-sm text-gray-400">Days Completed</div>
          </div>
          <div className="bg-aoc-darker border border-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-aoc-silver mb-2">
              {yearConfig.totalDays - completedDays}
            </div>
            <div className="text-sm text-gray-400">Days Remaining</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Made by{" "}
            <a
              href="https://gerwint.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aoc-green hover:text-aoc-gold transition-colors"
            >
              GerwinT
            </a>
            . Advent of Code is created by{" "}
            <a
              href="https://adventofcode.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aoc-green hover:text-aoc-gold transition-colors"
            >
              Eric Wastl
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
