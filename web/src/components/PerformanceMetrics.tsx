"use client";

import { Clock, Zap, Timer, TrendingUp, Activity } from "lucide-react";
import { PerformanceData, PerformanceStats } from "@/lib/solutions";
import { cn } from "@/lib/utils";

interface PerformanceMetricsProps {
  performance: PerformanceData;
  className?: string;
}

function formatTime(ms: number): string {
  if (ms < 0.001) {
    return `${(ms * 1000000).toFixed(0)}ns`;
  } else if (ms < 1) {
    return `${(ms * 1000).toFixed(1)}µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

function getPerformanceColor(ms: number): string {
  if (ms < 1) return "text-green-400";
  if (ms < 50) return "text-lime-400";
  if (ms < 200) return "text-yellow-400";
  if (ms < 1000) return "text-orange-400";
  return "text-red-400";
}

function getPerformanceBgColor(ms: number): string {
  if (ms < 1) return "bg-green-400";
  if (ms < 50) return "bg-lime-400";
  if (ms < 200) return "bg-yellow-400";
  if (ms < 1000) return "bg-orange-400";
  return "bg-red-400";
}

function StatCard({ label, value, icon: Icon, subtext }: { 
  label: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string }>;
  subtext?: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-xl font-mono font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function PartPerformanceRow({ label, stats }: { 
  label: string; 
  stats: PerformanceStats; 
}) {
  return (
    <div className="flex items-center gap-6 py-3 border-b border-gray-800 last:border-0">
      <span className="text-sm font-medium text-white w-14">{label}</span>
      <div className="flex-1 grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-500 mb-1">min</div>
          <div className="font-mono text-sm text-gray-400">{formatTime(stats.min)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">median</div>
          <div className="font-mono text-sm text-white">{formatTime(stats.median)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">mean</div>
          <div className={cn("font-mono text-sm font-bold", getPerformanceColor(stats.mean))}>
            {formatTime(stats.mean)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">max</div>
          <div className="font-mono text-sm text-gray-400">{formatTime(stats.max)}</div>
        </div>
      </div>
    </div>
  );
}

export function PerformanceSection({ performance, className }: PerformanceMetricsProps) {
  const totalMean = performance.part1.mean + (performance.part2?.mean ?? 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", getPerformanceBgColor(totalMean), "bg-opacity-20")}>
            <Zap className={cn("w-5 h-5", getPerformanceColor(totalMean))} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Performance</h2>
            <p className="text-sm text-gray-400">
              Benchmarked with {performance.part1.runs} runs • {performance.runtime}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-2xl font-mono font-bold", getPerformanceColor(totalMean))}>
            {formatTime(totalMean)}
          </div>
          <div className="text-xs text-gray-500">total runtime</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          label="Part 1 Mean" 
          value={formatTime(performance.part1.mean)} 
          icon={Timer}
        />
        {performance.part2 && (
          <StatCard 
            label="Part 2 Mean" 
            value={formatTime(performance.part2.mean)} 
            icon={Timer}
          />
        )}
        <StatCard 
          label="Total Runs" 
          value={performance.part1.runs.toString()} 
          icon={Activity}
          subtext="per part"
        />
        <StatCard 
          label="Benchmarked" 
          value={performance.benchmarkedAt.split('T')[0]} 
          icon={Clock}
        />
      </div>

      {/* Performance Bars */}
      <div className="space-y-6 bg-gray-900/50 rounded-xl p-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>Execution Time Distribution</span>
        </div>
        
        <PartPerformanceRow label="Part 1" stats={performance.part1} />
        
        {performance.part2 && (
          <PartPerformanceRow label="Part 2" stats={performance.part2} />
        )}
      </div>
    </div>
  );
}
