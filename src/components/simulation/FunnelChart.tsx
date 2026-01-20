"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Filter } from "lucide-react";

export interface FunnelStage {
  name: string;
  count: number;
  removed: number;
  percentage: number;
  isLoading?: boolean;
}

interface FunnelChartProps {
  data?: FunnelStage[];
  isLoading?: boolean;
  currentLoadingIndex?: number;
}

const defaultFunnelData: FunnelStage[] = [
  { name: "Global Security Master", count: 10000, removed: 0, percentage: 100 },
  { name: "Credit Rating Filter", count: 8000, removed: 2000, percentage: 80 },
  { name: "Country Restrictions", count: 6500, removed: 1500, percentage: 65 },
  { name: "Sector Limits", count: 5200, removed: 1300, percentage: 52 },
  { name: "ESG Exclusions", count: 4800, removed: 400, percentage: 48 },
  { name: "Tradable Universe", count: 4200, removed: 600, percentage: 42 },
];

// Color palette - warm tones progressing to success
const stageColors = [
  { bg: "rgb(99 102 241)", text: "white" },      // Indigo
  { bg: "rgb(139 92 246)", text: "white" },      // Violet  
  { bg: "rgb(168 85 247)", text: "white" },      // Purple
  { bg: "rgb(217 70 239)", text: "white" },      // Fuchsia
  { bg: "rgb(236 72 153)", text: "white" },      // Pink
  { bg: "rgb(16 185 129)", text: "white" },      // Emerald (final)
];

export function FunnelChart({ data, isLoading = false, currentLoadingIndex = -1 }: FunnelChartProps) {
  const funnelData = data && data.length > 0 ? data : defaultFunnelData;
  
  // Calculate summary stats
  const startingCount = funnelData[0]?.count || 10000;
  const finalCount = funnelData[funnelData.length - 1]?.count || 0;
  const totalRemoved = startingCount - finalCount;
  const passRate = Math.round((finalCount / startingCount) * 100);

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white">
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Universe Filtering Funnel
                </h3>
                {isLoading && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing constraints...
                  </p>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Funnel Stages */}
        <div className="p-6 space-y-3">
          {funnelData.map((stage, idx) => {
            const isCurrentlyLoading = isLoading && idx === currentLoadingIndex;
            const isPending = isLoading && idx > currentLoadingIndex && currentLoadingIndex >= 0;
            const isFirst = idx === 0;
            const isLast = idx === funnelData.length - 1;
            const colorIdx = Math.min(idx, stageColors.length - 1);
            const color = isLast ? stageColors[stageColors.length - 1] : stageColors[colorIdx];
            
            // Calculate total filtered from baseline
            const totalFiltered = startingCount - stage.count;
            
            return (
              <div 
                key={stage.name} 
                className={`group relative transition-all duration-300 ${
                  isCurrentlyLoading ? "animate-pulse" : ""
                } ${isPending ? "opacity-30" : ""}`}
                style={{ 
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Row container */}
                <div className="flex items-center gap-4">
                  {/* Label */}
                  <div className="w-44 shrink-0">
                    <span className={`text-sm font-medium transition-colors ${
                      isLast 
                        ? "text-emerald-700" 
                        : "text-slate-700"
                    }`}>
                      {stage.name}
                    </span>
                    {isCurrentlyLoading && (
                      <Loader2 className="w-3 h-3 ml-1.5 inline animate-spin text-indigo-500" />
                    )}
                  </div>

                  {/* Bar container */}
                  <div className="flex-1 relative">
                    {/* Track (full width background) */}
                    <div className="h-11 rounded-lg bg-slate-100 overflow-hidden relative">
                      {/* Filled bar */}
                      <div
                        className={`absolute inset-y-0 left-0 rounded-lg flex items-center transition-all duration-700 ease-out ${
                          isLast ? "shadow-lg shadow-emerald-500/30" : ""
                        }`}
                        style={{
                          width: isPending ? "0%" : `${stage.percentage}%`,
                          backgroundColor: color.bg,
                        }}
                      >
                        {/* Count inside bar */}
                        <span 
                          className={`absolute right-3 text-sm font-bold tabular-nums transition-opacity duration-300 ${
                            stage.percentage < 15 ? "opacity-0" : ""
                          }`}
                          style={{ color: color.text }}
                        >
                          {isPending ? "—" : stage.count.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Count outside bar for small percentages */}
                      {stage.percentage < 15 && !isPending && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold tabular-nums text-slate-600">
                          {stage.count.toLocaleString()}
                        </span>
                      )}

                      {/* Filtered indicator in the empty space */}
                      {!isFirst && totalFiltered > 0 && !isPending && (
                        <div 
                          className="absolute inset-y-0 right-0 flex items-center justify-end pr-3 pointer-events-none"
                          style={{ width: `${100 - stage.percentage}%` }}
                        >
                          <span className="text-xs font-medium text-red-600 tabular-nums">
                            −{totalFiltered.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        
      </CardContent>
    </Card>
  );
}
