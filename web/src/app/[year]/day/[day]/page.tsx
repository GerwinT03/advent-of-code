import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CodeBlock } from "@/components/CodeBlock";
import { PerformanceSection } from "@/components/PerformanceMetrics";
import { getSolution, getSolutions } from "@/lib/solutions";
import { ArrowLeft, ArrowRight, Star, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYearConfig, getAvailableYears } from "@/lib/config";
import { VisualizationPlayer } from "@/components/VisualizationPlayer";

interface PageProps {
  params: Promise<{ year: string; day: string }>;
}

export function generateStaticParams() {
  const params: { year: string; day: string }[] = [];
  
  for (const year of getAvailableYears()) {
    const yearConfig = getYearConfig(year);
    if (yearConfig) {
      for (let day = 1; day <= yearConfig.totalDays; day++) {
        params.push({
          year: year.toString(),
          day: day.toString(),
        });
      }
    }
  }
  
  return params;
}

export default async function DayPage({ params }: PageProps) {
  const { year: yearStr, day } = await params;
  const year = parseInt(yearStr);
  const dayNum = parseInt(day);

  const yearConfig = getYearConfig(year);
  if (!yearConfig) {
    notFound();
  }

  if (isNaN(dayNum) || dayNum < 1 || dayNum > yearConfig.totalDays) {
    notFound();
  }

  const solution = getSolution(dayNum, year);
  const solutions = getSolutions(year);
  const totalStars = solutions.reduce((sum, s) => sum + s.stars, 0);

  if (!solution || !solution.completed) {
    notFound();
  }

  const dayStr = dayNum.toString().padStart(2, "0");
  const prevDay = dayNum > 1 ? dayNum - 1 : null;
  const nextDay = dayNum < yearConfig.totalDays ? dayNum + 1 : null;
  const prevCompleted = prevDay ? solutions[prevDay - 1]?.completed : false;
  const nextCompleted = nextDay ? solutions[nextDay - 1]?.completed : false;

  return (
    <div className="min-h-screen">
      <Header totalStars={totalStars} year={year} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/${year}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Calendar
          </Link>
          <div className="flex items-center gap-2">
            {prevDay && prevCompleted && (
              <Link
                href={`/${year}/day/${prevDay}`}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            {nextDay && nextCompleted && (
              <Link
                href={`/${year}/day/${nextDay}`}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Day Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl font-bold text-aoc-green">{dayStr}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {solution.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2].map((starNum) => (
                  <Star
                    key={starNum}
                    className={cn(
                      "w-5 h-5",
                      starNum <= solution.stars
                        ? "fill-aoc-gold text-aoc-gold"
                        : "text-gray-700"
                    )}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  {solution.stars} / 2 stars
                </span>
              </div>
            </div>
          </div>
          <a
            href={`https://adventofcode.com/${year}/day/${dayNum}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-aoc-green hover:text-aoc-gold transition-colors"
          >
            View puzzle on adventofcode.com
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Performance Section */}
        {solution.performance && (
          <div className="mb-8">
            <PerformanceSection performance={solution.performance} />
          </div>
        )}

        {/* Visualizations */}
        {solution.visualizations.length > 0 && (
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold text-white">Visualizations</h2>
            {solution.visualizations.map((viz) => (
              <VisualizationPlayer
                key={viz.id}
                year={year}
                day={dayNum}
                visualization={viz}
              />
            ))}
          </div>
        )}

        {/* Code Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Solution</h2>
          <CodeBlock code={solution.code} language={yearConfig.language === "csharp" ? "csharp" : "typescript"} />
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-800">
          {prevDay && prevCompleted ? (
            <Link
              href={`/${year}/day/${prevDay}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Day {prevDay.toString().padStart(2, "0")}
            </Link>
          ) : (
            <div />
          )}
          {nextDay && nextCompleted ? (
            <Link
              href={`/${year}/day/${nextDay}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              Day {nextDay.toString().padStart(2, "0")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>
    </div>
  );
}
