import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";

type CreateProjectBody = {
  name?: unknown;
  customerId?: unknown;
};

export async function GET() {
  console.log("[API /api/projects GET] Request received - fetching all projects");
  console.log("[API /api/projects GET] Environment variables available:", {
    MONGODB_URL: !!process.env.MONGODB_URL,
    DB_NAME: !!process.env.DB_NAME,
    LYZR_API_KEY: !!process.env.LYZR_API_KEY,
  });

  try {
    console.log("[API /api/projects GET] Attempting to connect to MongoDB...");
    await connectDB();
    console.log("[API /api/projects GET] MongoDB connection successful");

    console.log("[API /api/projects GET] Fetching projects from database...");
    const docs = await Project.find({})
      .select("name customerId createdAt rulesets")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[API /api/projects GET] Successfully fetched ${docs.length} projects`);

    return NextResponse.json({
      projects: docs.map((d) => ({
        id: d._id.toString(),
        customerId: d.customerId,
        name: d.name,
        createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : undefined,
        rulesetsCount: d.rulesets?.length || 0,
        latestRuleset: d.rulesets && d.rulesets.length > 0
          ? {
              version: d.rulesets[d.rulesets.length - 1].version,
              versionName: d.rulesets[d.rulesets.length - 1].versionName,
              createdAt: d.rulesets[d.rulesets.length - 1].createdAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("[API /api/projects GET] ERROR:", error);
    console.error("[API /api/projects GET] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch projects",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log("[API /api/projects POST] Request received - creating new project");
  
  let body: CreateProjectBody;
  try {
    body = (await req.json()) as CreateProjectBody;
  } catch {
    console.error("[API /api/projects POST] ERROR: Invalid JSON body");
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    console.error("[API /api/projects POST] ERROR: Missing project name");
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 },
    );
  }

  const customerId = typeof body?.customerId === "string" ? body.customerId.trim() : "";
  if (!customerId) {
    console.error("[API /api/projects POST] ERROR: Missing customerId");
    return NextResponse.json(
      { error: "customerId is required" },
      { status: 400 },
    );
  }

  console.log("[API /api/projects POST] Creating project:", { name, customerId });

  try {
    console.log("[API /api/projects POST] Connecting to MongoDB...");
    await connectDB();
    console.log("[API /api/projects POST] MongoDB connection successful");

    console.log("[API /api/projects POST] Creating project document...");
    const project = await Project.create({ 
      name,
      customerId,
    });
    console.log("[API /api/projects POST] Project created successfully:", project._id.toString());

    return NextResponse.json(
      {
        id: project._id.toString(),
        customerId: project.customerId,
        name: project.name,
        createdAt: project.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API /api/projects POST] ERROR:", error);
    console.error("[API /api/projects POST] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
