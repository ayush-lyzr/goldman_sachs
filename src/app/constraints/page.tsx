"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkflowStepper } from "@/components/workflow/WorkflowStepper";
import { ConstraintCard } from "@/components/constraints/ConstraintCard";
import { ExtractedRulesDisplay } from "@/components/constraints/ExtractedRulesDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  Loader2,
  FileSearch,
  Sparkles,
  Layers,
  Zap,
  BookOpen,
  Clock,
  AlertCircle
} from "lucide-react";

interface ExtractedRule {
  title: string;
  rules: string[];
}

const steps = [
  { id: 1, name: "Upload", status: "completed" as const },
  { id: 2, name: "Extract", status: "current" as const },
  { id: 3, name: "Generate Rules", status: "upcoming" as const },
  { id: 4, name: "Gap Analysis", status: "upcoming" as const },
  { id: 5, name: "Simulate", status: "upcoming" as const },
];

const constraints = [
  {
    id: "1",
    clauseText: "Portfolio must maintain predominantly investment grade securities",
    sourcePage: 4,
    confidence: 78,
    isAmbiguous: true,
    interpretations: [
      { id: "conservative", label: "Conservative (≥80%)", description: "At least 80% of holdings must be BBB- or higher rated" },
      { id: "moderate", label: "Moderate (≥65%)", description: "At least 65% of holdings must be BBB- or higher rated" },
      { id: "liberal", label: "Liberal (≥51%)", description: "Simple majority must be BBB- or higher rated" },
    ],
  },
  {
    id: "2",
    clauseText: "Maximum single issuer exposure of 5% of portfolio NAV",
    sourcePage: 5,
    confidence: 95,
    isAmbiguous: false,
  },
  {
    id: "3",
    clauseText: "No investments permitted in Russian Federation domiciled entities",
    sourcePage: 7,
    confidence: 98,
    isAmbiguous: false,
  },
  {
    id: "4",
    clauseText: "Tobacco and controversial weapons manufacturers excluded",
    sourcePage: 8,
    confidence: 92,
    isAmbiguous: false,
  },
  {
    id: "5",
    clauseText: "Financial sector allocation should not exceed reasonable limits",
    sourcePage: 6,
    confidence: 65,
    isAmbiguous: true,
    interpretations: [
      { id: "strict", label: "Strict (≤20%)", description: "Maximum 20% allocation to financial sector" },
      { id: "standard", label: "Standard (≤25%)", description: "Maximum 25% allocation to financial sector" },
      { id: "flexible", label: "Flexible (≤30%)", description: "Maximum 30% allocation to financial sector" },
    ],
  },
];

function ConstraintsPageContent() {
  const router = useRouter();
  const [extractedRules, setExtractedRules] = useState<ExtractedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [pdfFilename, setPdfFilename] = useState<string>("");

  useEffect(() => {
    // Load extracted rules from sessionStorage
    const loadData = async () => {
      if (typeof window !== 'undefined') {
        const storedRules = sessionStorage.getItem("extractedRules");
        const storedPDF = sessionStorage.getItem("extractedPDF");
        
        let parsedRules: ExtractedRule[] = [];
        
        if (storedRules) {
          try {
            const rules = JSON.parse(storedRules);
            parsedRules = Array.isArray(rules) ? rules : [];
            setExtractedRules(parsedRules);
          } catch (error) {
            console.error("Error parsing extracted rules:", error);
            setExtractedRules([]);
          }
        }
        
        if (storedPDF) {
          try {
            const pdf = JSON.parse(storedPDF);
            setPdfFilename(pdf.filename || "Document");
          } catch (error) {
            console.error("Error parsing PDF data:", error);
          }
        }
        
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleGenerateRules = async () => {
    if (extractedRules.length === 0) {
      alert("No extracted rules available. Please upload and extract a document first.");
      return;
    }

    setGenerating(true);
    try {
      // Get customerId and projectId from sessionStorage
      let customerId = "";
      let projectId = "";
      
      if (typeof window !== 'undefined') {
        customerId = sessionStorage.getItem("currentCustomerId") || "";
        projectId = sessionStorage.getItem("currentProjectId") || "";
        
        if (!customerId || !projectId) {
          throw new Error("Missing customer or project ID. Please start from the upload step.");
        }
      }

      // Step 1: Call rules-to-column agent with the extracted rules
      setProcessingStep("Generating rules mapping...");
      console.log("Step 1: Calling rules-to-column agent...");
      const rulesToColumnResponse = await fetch("/api/agents/rules-to-column", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          customerId: customerId,
          rulesExtractorResponse: { rules: extractedRules },
        }),
      });

      if (!rulesToColumnResponse.ok) {
        const errorData = await rulesToColumnResponse.json();
        throw new Error(errorData.error || "Failed to generate rules");
      }

      const rulesToColumnData = await rulesToColumnResponse.json();
      console.log("Rules-to-column successful:", rulesToColumnData);

      // Check for errors in the response
      if (rulesToColumnData.error) {
        throw new Error(`Rules generation failed: ${rulesToColumnData.error}`);
      }

      // Step 2: Call gap analysis agent with the rules-to-column response
      setProcessingStep("Performing gap analysis...");
      console.log("Step 2: Calling gap analysis agent...");
      const gapAnalysisResponse = await fetch("/api/agents/gap-analysis", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          customerId: customerId,
          rulesToColumnResponse: rulesToColumnData,
        }),
      });

      if (!gapAnalysisResponse.ok) {
        const errorData = await gapAnalysisResponse.json();
        throw new Error(errorData.error || "Failed to perform gap analysis");
      }

      const gapAnalysisData = await gapAnalysisResponse.json();
      console.log("Gap analysis successful:", gapAnalysisData);

      // Check for errors in the response
      if (gapAnalysisData.error) {
        throw new Error(`Gap analysis failed: ${gapAnalysisData.error}`);
      }

      // Store both results for the next page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("mappedRules", JSON.stringify(rulesToColumnData.mapped_rules || []));
        sessionStorage.setItem("gapAnalysis", JSON.stringify(gapAnalysisData.mapped_rules || []));
      }

      // Navigate to rules page
      router.push("/rules");
    } catch (error) {
      console.error("Error in rule generation flow:", error);
      alert(error instanceof Error ? error.message : "Failed to generate rules. Please try again.");
    } finally {
      setGenerating(false);
      setProcessingStep("");
    }
  };
  
  // Calculate stats from extracted rules
  const totalRules = extractedRules.reduce((acc, section) => acc + section.rules.length, 0);
  const totalSections = extractedRules.length;

  return (
    <AppLayout>
      <div className="space-y-3 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 text-white animate-fade-up">
          {/* Background effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/15 rounded-full blur-3xl" />
          
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                  <FileSearch className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                      Step 2 of 5
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-[10px] font-medium text-cyan-400">
                      {loading ? "Processing..." : "Extraction Complete"}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Constraint Extraction
                  </h1>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Workflow Stepper */}
        <WorkflowStepper steps={steps} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="relative mx-auto w-14 h-14 mb-5">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary/10">
                      <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Processing Document</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Extracting investment constraints from your guidelines document...
                  </p>
                </CardContent>
              </Card>
            ) : extractedRules.length > 0 ? (
              <ExtractedRulesDisplay rules={extractedRules} />
            ) : (
              <div className="space-y-3">
                {constraints.map((constraint, index) => (
                  <div 
                    key={constraint.id}
                    className="animate-fade-up opacity-0"
                    style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}
                  >
                    <ConstraintCard {...constraint} />
                  </div>
                ))}
              </div>
            )}

            {/* Processing Status & Action */}
            <div className="space-y-3 pt-3">
              {generating && processingStep && (
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="relative p-2 rounded-full bg-primary/10">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{processingStep}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This may take a moment...</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Processing</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerateRules} 
                  size="default"
                  disabled={loading || generating || extractedRules.length === 0}
                  className="gap-2 px-6 h-10 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate Rules & Analyze</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Document Info Card */}
            <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Source Document
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {pdfFilename || "Investment_Guidelines_Q4_2024.pdf"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {loading ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Processed
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="pt-2.5 border-t border-border/50 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Sections Found</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {loading ? "..." : (totalSections > 0 ? totalSections : "5")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Rules</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {loading ? "..." : (totalRules > 0 ? totalRules : "—")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Avg per Section</span>
                    <span className="font-bold text-primary tabular-nums">
                      {loading ? "..." : (totalSections > 0 ? (totalRules / totalSections).toFixed(1) : "—")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Status Card */}
            <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${loading ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${loading ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {loading ? "Processing..." : "Extraction Complete"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {loading
                        ? "The extraction agent is processing your document..."
                        : "Constraint Extraction Agent processed the document successfully. Review before proceeding."
                      }
                    </p>
                  </div>
                </div>

                {/* Tip */}
                {!loading && extractedRules.length === 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>No extracted rules found. Using demo constraints for preview.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tip Card */}
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pro Tip</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Hover over constraint cards to see additional details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function ConstraintsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="space-y-3 max-w-[1400px] mx-auto">
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="relative mx-auto w-14 h-14 mb-5">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary/10">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading...</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Preparing the constraints page...
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    }>
      <ConstraintsPageContent />
    </Suspense>
  );
}
