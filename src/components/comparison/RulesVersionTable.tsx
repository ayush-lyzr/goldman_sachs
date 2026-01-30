"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from "react";
import * as React from "react";

interface ComparisonResult {
  tag: "unchanged" | "modified" | "added" | "removed";
  previous: string | null;
  current: string | null;
}

interface VersionComparison {
  from: string;
  to: string;
  results: ComparisonResult[];
}

interface VersionInfo {
  version: number;
  versionName: string;
  createdAt: string;
}

interface MultiVersionDiffData {
  versions: VersionInfo[];
  comparisons: VersionComparison[];
}

interface RulesVersionTableProps {
  data: MultiVersionDiffData;
  onStatsCalculated?: (stats: { total: number; modified: number; added: number; removed: number }) => void;
}

interface RuleRow {
  ruleIndex: number;
  versions: Record<string, { text: string; tag: string }>;
}

export function RulesVersionTable({ data, onStatsCalculated }: RulesVersionTableProps) {
  // Process the comparison data into a table structure
  const { ruleRows, stats } = useMemo(() => {
    const ruleMap = new Map<string, RuleRow>();
    const versions = data.versions.map(v => v.versionName);
    let globalRuleIndex = 0;
    
    // Build rule map from comparisons
    // Use rule text content as a unique identifier across versions
    data.comparisons.forEach((comparison) => {
      comparison.results.forEach((result, comparisonIndex) => {
        // Create a unique key based on the rule content (use current or previous text)
        const ruleContent = result.current || result.previous || `empty-${comparisonIndex}`;
        const ruleKey = `${comparison.to}-${comparisonIndex}`;
        
        // Try to find existing rule by matching content across versions
        let existingKey: string | undefined;
        for (const [key, rule] of ruleMap.entries()) {
          const existingTexts = Object.values(rule.versions).map(v => v.text);
          if (existingTexts.includes(ruleContent) || 
              (result.previous && existingTexts.includes(result.previous))) {
            existingKey = key;
            break;
          }
        }
        
        const actualKey = existingKey || ruleKey;
        
        if (!ruleMap.has(actualKey)) {
          ruleMap.set(actualKey, {
            ruleIndex: globalRuleIndex++,
            versions: {}
          });
        }
        
        const rule = ruleMap.get(actualKey)!;
        
        // Set previous version data
        if (result.previous && !rule.versions[comparison.from]) {
          rule.versions[comparison.from] = {
            text: result.previous,
            tag: result.tag
          };
        }
        
        // Set current version data
        if (result.current) {
          rule.versions[comparison.to] = {
            text: result.current,
            tag: result.tag
          };
        }
      });
    });

    const rows = Array.from(ruleMap.values());
    
    // Calculate statistics
    let modified = 0, added = 0, removed = 0;
    
    rows.forEach(rule => {
      const tags = Object.values(rule.versions).map(v => v.tag);
      if (tags.includes("modified")) modified++;
      if (tags.includes("added")) added++;
      if (tags.includes("removed")) removed++;
    });

    return {
      ruleRows: rows,
      stats: {
        total: modified + added + removed,
        modified,
        added,
        removed
      }
    };
  }, [data]);

  // Notify parent of calculated stats
  React.useEffect(() => {
    if (onStatsCalculated) {
      onStatsCalculated(stats);
    }
  }, [stats, onStatsCalculated]);

  // Current/latest version on the RIGHT (fixed); older versions on the left (scrollable)
  const latestVersionObj = data.versions[data.versions.length - 1];
  const otherVersionObjs = data.versions.slice(0, -1); // older versions, left to right
  const versionIndexByName = useMemo(() => {
    return Object.fromEntries(data.versions.map((v, idx) => [v.versionName, idx]));
  }, [data.versions]);

  const getCellClass = (tag: string) => {
    const classMap: Record<string, string> = {
      unchanged: "bg-slate-50 dark:bg-slate-900/30",
      modified: "bg-amber-50 dark:bg-amber-900/10 border-l-2 border-amber-400",
      added: "bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-emerald-400",
      removed: "bg-rose-50 dark:bg-rose-900/10 border-l-2 border-rose-400",
      "not-present": "bg-slate-100/50 dark:bg-slate-800/20"
    };
    return classMap[tag] || classMap.unchanged;
  };

  const getStatusForVersion = (rule: RuleRow, versionName: string, versionIndex: number): string => {
    const versionData = rule.versions[versionName];
    
    if (!versionData || !versionData.text) {
      return "not-present";
    }
    
    // For the first version, everything is unchanged
    if (versionIndex === 0) {
      return "unchanged";
    }
    
    return versionData.tag;
  };

  const formatStatus = (status: string): string => {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">

      {/* Legend */}
      <Card className="bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
        <CardContent className="p-3">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Legend:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Unchanged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-amber-400 bg-amber-50 dark:bg-amber-900/10" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Modified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-rose-400 bg-rose-50 dark:bg-rose-900/10" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Removed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/20" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Not Present</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table - Single table with sticky left + sticky current (right) for perfect row alignment */}
      <Card className="border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-3 border-b border-slate-700">
          <h3 className="font-mono font-semibold text-base">
            Version Comparison ({data.versions.map(v => v.versionName).join(' → ')} — current fixed on right)
          </h3>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "900px" }}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th
                  className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900/50 text-left px-5 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800"
                  style={{ width: "200px" }}
                >
                  Rule
                </th>

                {otherVersionObjs.map((versionObj, i) => (
                  <th
                    key={`version-${versionObj.version}`}
                    className="text-center px-5 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 min-w-[300px]"
                  >
                    {versionObj.versionName}
                    {i < otherVersionObjs.length - 1 && (
                      <span className="ml-2 text-slate-400 dark:text-slate-600">→</span>
                    )}
                  </th>
                ))}

                <th className="sticky right-0 z-30 bg-slate-100 dark:bg-slate-800/80 text-center px-5 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider min-w-[400px] border-l-2 border-slate-300 dark:border-slate-600">
                  {latestVersionObj.versionName}
                  <Badge className="ml-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[9px] px-2 py-0.5 font-bold">
                    Current
                  </Badge>
                </th>
              </tr>
            </thead>

            <tbody>
              {ruleRows.map((rule) => (
                <tr
                  key={rule.ruleIndex}
                  className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="sticky left-0 z-20 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm px-5 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                    Rule {rule.ruleIndex + 1}
                  </td>

                  {otherVersionObjs.map((versionObj) => {
                    const idx = (versionIndexByName[versionObj.versionName] ?? 0) as number;
                    const status = getStatusForVersion(rule, versionObj.versionName, idx);
                    return (
                      <td
                        key={`cell-${rule.ruleIndex}-${versionObj.version}`}
                        className={`px-5 py-4 text-sm text-slate-700 dark:text-slate-300 align-top border-r border-slate-200 dark:border-slate-800 ${getCellClass(
                          status
                        )}`}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-default">
                              {rule.versions[versionObj.versionName]?.text || "—"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{formatStatus(status)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}

                  {(() => {
                    const idx = (versionIndexByName[latestVersionObj.versionName] ?? data.versions.length - 1) as number;
                    const status = getStatusForVersion(rule, latestVersionObj.versionName, idx);
                    return (
                      <td
                        className={`sticky right-0 z-20 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-sm px-5 py-4 text-sm text-slate-700 dark:text-slate-300 align-top border-l-2 border-slate-300 dark:border-slate-600 ${getCellClass(
                          status
                        )}`}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-default">
                              {rule.versions[latestVersionObj.versionName]?.text || "—"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{formatStatus(status)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </TooltipProvider>
  );
}
