"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

interface Security {
  _id: string;
  ISIN: string;
  CUSIP: string;
  FIGI: string;
  Ticker: string;
  Security_Name: string;
  Issuer_Name: string;
  Issuer_Country: string;
  Country_of_Risk: string;
  Instrument_Type: string;
  Seniority: string;
  Currency: string;
  Coupon_Type: string;
  Coupon_Rate: number;
  Issue_Date: string;
  Maturity_Date: string;
  Days_to_Maturity: number;
  Rating_SP: string;
  Rating_Moodys: string;
  Rating_Fitch: string;
  Composite_Rating: string;
  IG_Flag: string;
  Developed_Market: string;
  Sector: string;
  Index_Member: string;
  Approved_Index: string;
  Callable: string;
  Putable: string;
  Subordinated_Flag: string;
  ESG_Exclusion: string;
  Shariah_Compliant: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Column definitions for the table
const columns = [
  { key: "ISIN", label: "ISIN", width: "130px" },
  { key: "Ticker", label: "Ticker", width: "90px" },
  { key: "Security_Name", label: "Security Name", width: "250px" },
  { key: "Issuer_Name", label: "Issuer", width: "180px" },
  { key: "Issuer_Country", label: "Country", width: "70px" },
  { key: "Instrument_Type", label: "Type", width: "90px" },
  { key: "Currency", label: "Ccy", width: "50px" },
  { key: "Coupon_Rate", label: "Coupon", width: "70px" },
  { key: "Maturity_Date", label: "Maturity", width: "100px" },
  { key: "Composite_Rating", label: "Rating", width: "70px" },
  { key: "IG_Flag", label: "IG", width: "50px" },
  { key: "Sector", label: "Sector", width: "100px" },
  { key: "Shariah_Compliant", label: "Shariah", width: "60px" },
];

export function DatabaseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSecurities = useCallback(async (page: number, searchTerm: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "100",
        search: searchTerm,
      });
      const response = await fetch(`/api/securities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSecurities(data.securities);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching securities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSecurities(currentPage, search);
    }
  }, [isOpen, currentPage, fetchSecurities]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSecurities(1, search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating.startsWith("AAA") || rating.startsWith("AA")) return "text-emerald-600";
    if (rating.startsWith("A")) return "text-green-600";
    if (rating.startsWith("BBB")) return "text-yellow-600";
    if (rating.startsWith("BB")) return "text-orange-600";
    if (rating.startsWith("B")) return "text-red-600";
    return "text-slate-600";
  };

  const formatCellValue = (key: string, value: string | number) => {
    if (key === "Coupon_Rate") {
      return `${(value as number).toFixed(2)}%`;
    }
    if (key === "IG_Flag" || key === "Shariah_Compliant") {
      return value === "Yes" ? "Y" : "N";
    }
    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 group"
        >
          <Database className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
          <span className="hidden sm:inline text-sm font-medium">Database</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[85vh] p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-xl flex flex-col">
        <DialogTitle className="sr-only">Securities Database</DialogTitle>
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#64A8F0] shadow-md">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Securities Database
              </h2>
              <p className="text-xs text-slate-500">
                {pagination ? `${pagination.totalCount.toLocaleString()} securities` : "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar - Fixed */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by ISIN, Security Name, Issuer, or Ticker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button size="sm" onClick={handleSearch} className="h-9">
              Search
            </Button>
          </div>
        </div>

        {/* Table Content - Scrollable, fills remaining space */}
        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : securities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-base font-semibold text-slate-700 mb-2">No Securities Found</h3>
              <p className="text-sm text-slate-500">
                {search ? "Try a different search term" : "No data available"}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap"
                      style={{ minWidth: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {securities.map((security, index) => (
                  <tr
                    key={security._id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    {columns.map((col) => {
                      const value = security[col.key as keyof Security];
                      const isRating = col.key === "Composite_Rating";
                      const isIG = col.key === "IG_Flag";
                      const isShariah = col.key === "Shariah_Compliant";
                      
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 border-b border-slate-100 ${
                            isRating ? `font-semibold ${getRatingColor(value as string)}` : ""
                          } ${isIG ? (value === "Yes" ? "text-emerald-600 font-medium" : "text-slate-400") : ""}
                          ${isShariah ? (value === "Yes" ? "text-teal-600 font-medium" : "text-slate-400") : ""}
                          ${col.key === "Security_Name" || col.key === "Issuer_Name" ? "max-w-[250px] truncate" : ""}
                          `}
                          title={col.key === "Security_Name" || col.key === "Issuer_Name" ? String(value) : undefined}
                        >
                          {formatCellValue(col.key, value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer - Fixed */}
        {pagination && pagination.totalCount > 0 && (
          <div className="flex-shrink-0 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700 min-w-[100px] text-center">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
