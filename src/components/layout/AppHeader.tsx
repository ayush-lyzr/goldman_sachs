"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, RefreshCw } from "lucide-react";
import { UpdateGuidelinesDialog } from "@/components/dashboard/UpdateGuidelinesDialog";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AppHeaderProps {
  mandateName?: string;
  status?: "compliant" | "review" | "issues";
}

export function AppHeader({ mandateName, status = "compliant" }: AppHeaderProps) {
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const customerId = sessionStorage.getItem("currentCustomerId");
        if (!customerId) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/projects/${customerId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectName(data.name);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, []);

  const statusConfig = {
    compliant: { label: "Compliant", variant: "success" as const },
    review: { label: "Under Review", variant: "warning" as const },
    issues: { label: "Issues Found", variant: "destructive" as const },
  };

  const currentStatus = statusConfig[status];
  const displayName = mandateName || projectName || "No Project Loaded";

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3.5 bg-[#64A8F0] border-b border-[#5594d9] shadow-sm">
      <div className="flex items-center gap-6">
        {/* Goldman Sachs Logo */}
        <Link
          href="/"
          aria-label="Go to home"
          className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#64A8F0] hover:opacity-95 active:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-center w-9 h-9 bg-white rounded-sm shadow-sm">
            <span className="font-bold text-[#64A8F0] text-base tracking-tight">GS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-base leading-tight hidden sm:inline">Goldman Sachs</span>
            <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider hidden sm:inline">
              Investment Management
            </span>
          </div>
        </Link>
        
        {/* Project Info */}
        <div className="flex items-center gap-3 border-l border-white/20 pl-6 ml-2">
          <div>
            <h2 className="font-semibold text-white text-sm">
              {isLoading ? "Loading..." : displayName}
            </h2>
            <p className="text-[11px] text-white/70 font-medium">Guidelines Project</p>
          </div>
          {currentStatus.variant === "success" && (
            <Badge className="bg-white/95 text-[#64A8F0] hover:bg-white border-0 shadow-sm font-medium">
              {currentStatus.label}
            </Badge>
          )}
          {currentStatus.variant === "warning" && (
            <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-0 shadow-sm font-medium">
              {currentStatus.label}
            </Badge>
          )}
          {currentStatus.variant === "destructive" && (
            <Badge className="bg-rose-500 text-white hover:bg-rose-600 border-0 shadow-sm font-medium">
              {currentStatus.label}
            </Badge>
          )}
        </div>
      </div>

      
    </header>
  );
}
