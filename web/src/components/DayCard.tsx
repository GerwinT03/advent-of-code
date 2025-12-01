"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultYear } from "@/lib/config";

interface DayCardProps {
  day: number;
  year?: number;
  title: string;
  completed: boolean;
  stars: number;
}

export function DayCard({ day, year = defaultYear, title, completed, stars }: DayCardProps) {
  const dayStr = day.toString().padStart(2, "0");

  return (
    <Link href={completed ? `/${year}/day/${day}` : "#"}>
      <div
        className={cn(
          "day-card relative p-3 sm:p-4 rounded-lg border transition-all",
          completed
            ? "bg-aoc-darker border-aoc-green/30 hover:border-aoc-gold/50 cursor-pointer"
            : "bg-aoc-darker/50 border-gray-800 opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl sm:text-2xl font-bold text-aoc-green">{dayStr}</span>
          <div className="flex gap-0.5">
            {[1, 2].map((starNum) => (
              <Star
                key={starNum}
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5",
                  starNum <= stars
                    ? "fill-aoc-gold text-aoc-gold star-twinkle"
                    : "text-gray-700"
                )}
                style={{
                  animationDelay: starNum === 2 ? "0.5s" : "0s",
                }}
              />
            ))}
          </div>
        </div>
        <h3 className="text-sm text-gray-400 truncate">{title}</h3>
        {completed && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-aoc-green/5 to-transparent pointer-events-none" />
        )}
      </div>
    </Link>
  );
}
