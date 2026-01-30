import { NextResponse } from "next/server";
import { callLyzrAgent } from "@/lib/lyzr";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";

const AGENT_ID = "696a167ea5272eccb326c2ec";

interface RawRule {
  title: string;
  rules: string[];
}

interface VersionData {
  version: number;
  versionName: string;
  createdAt: string;
  raw_rules: RawRule[];
}

interface RulesDiffRequest {
  projectId: string;
  customerId: string;
  rulesExtractorResponse?: string | object;
  versions?: VersionData[]; // For multi-version comparison
}

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

interface MultiVersionDiffResponse {
  versions: Array<{
    version: number;
    versionName: string;
    createdAt: string;
  }>;
  comparisons: VersionComparison[];
}

/**
 * Rules Diff Agent API
 * 
 * POST /api/agents/rules-diff
 * 
 * Supports two modes:
 * 1. Single comparison (legacy): Compare current extraction vs one version
 * 2. Multi-version comparison: Compare all versions sequentially
 * 
 * Request Body (Multi-version mode):
 * {
 *   "projectId": "string",
 *   "customerId": "string",
 *   "versions": [{ version, versionName, createdAt, raw_rules }] // Optional
 * }
 * 
 * Response (Multi-version mode):
 * {
 *   "versions": [{ version, versionName, createdAt }],
 *   "comparisons": [
 *     {
 *       "from": "v1",
 *       "to": "v2",
 *       "results": [
 *         { "tag": "modified|added|removed|unchanged", "previous": "...", "current": "..." }
 *       ]
 *     }
 *   ]
 * }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RulesDiffRequest;

    if (!body.projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!body.customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    // If versions array provided, do multi-version comparison
    if (body.versions && body.versions.length > 0) {
      return await handleMultiVersionComparison(body);
    }

    // Legacy single comparison mode
    if (!body.rulesExtractorResponse) {
      return NextResponse.json(
        { error: "rulesExtractorResponse or versions is required" },
        { status: 400 }
      );
    }

    // Fetch all versions from DB for multi-version comparison
    await connectDB();
    const project = await Project.findOne({ customerId: body.customerId }).select("rulesets").lean();

    if (!project || !project.rulesets || project.rulesets.length === 0) {
      return NextResponse.json(
        { error: "No versions found for comparison" },
        { status: 404 }
      );
    }

    // Build versions array with raw_rules
    const versions: VersionData[] = project.rulesets.map((rs: any) => ({
      version: rs.version,
      versionName: rs.versionName,
      createdAt: rs.createdAt.toISOString(),
      raw_rules: rs.data.raw_rules || []
    }));

    // Add current extraction as the latest version
    const currentRules = typeof body.rulesExtractorResponse === "string" 
      ? JSON.parse(body.rulesExtractorResponse)
      : body.rulesExtractorResponse;
    
    versions.push({
      version: versions.length + 1,
      versionName: "Current",
      createdAt: new Date().toISOString(),
      raw_rules: Array.isArray(currentRules) ? currentRules : []
    });

    return await handleMultiVersionComparison({ ...body, versions });
  } catch (error) {
    console.error("Rules Diff Agent error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

async function handleMultiVersionComparison(body: RulesDiffRequest): Promise<NextResponse> {
  const versions = body.versions!;

  // Send all versions data in a single message
  const message = JSON.stringify({
    versions: versions.map(v => ({
      version: v.version,
      versionName: v.versionName,
      createdAt: v.createdAt,
      raw_rules: v.raw_rules
    }))
  });

  try {
    const response = await callLyzrAgent<MultiVersionDiffResponse>({
      user_id: "harshit@lyzr.ai",
      agent_id: AGENT_ID,
      session_id: body.customerId,
      message,
      apiKey: process.env.NEW_LYZR_API_KEY,
    });

    // Normalize comparison result tags if agent returns different casing
    const normalized: MultiVersionDiffResponse = {
      versions: response.versions ?? versions.map(v => ({ version: v.version, versionName: v.versionName, createdAt: v.createdAt })),
      comparisons: (response.comparisons ?? []).map((c: VersionComparison) => ({
        from: c.from,
        to: c.to,
        results: (c.results ?? []).map((r: ComparisonResult) => ({
          tag: (["unchanged", "modified", "added", "removed"] as const).includes((r.tag ?? "").toLowerCase() as ComparisonResult["tag"])
            ? (r.tag!.toLowerCase() as ComparisonResult["tag"])
            : "unchanged",
          previous: r.previous ?? null,
          current: r.current ?? null
        }))
      }))
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Rules diff agent error (multi-version):", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Rules diff agent failed",
        versions: versions.map(v => ({ version: v.version, versionName: v.versionName, createdAt: v.createdAt })),
        comparisons: []
      },
      { status: 500 }
    );
  }
}
