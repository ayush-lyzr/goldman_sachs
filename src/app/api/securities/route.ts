import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Security } from "@/models/Security";

export async function GET(req: NextRequest) {
  console.log("[API /api/securities GET] Request received");

  try {
    await connectDB();
    console.log("[API /api/securities GET] MongoDB connection successful");

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "ISIN";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;

    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page
    const skip = (validatedPage - 1) * validatedLimit;

    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { ISIN: { $regex: search, $options: "i" } },
          { Security_Name: { $regex: search, $options: "i" } },
          { Issuer_Name: { $regex: search, $options: "i" } },
          { Ticker: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    // Execute queries in parallel
    const [securities, totalCount] = await Promise.all([
      Security.find(query)
        .sort(sort)
        .skip(skip)
        .limit(validatedLimit)
        .lean(),
      Security.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / validatedLimit);

    console.log(`[API /api/securities GET] Returning ${securities.length} of ${totalCount} total securities`);

    return NextResponse.json({
      securities: securities.map((s) => ({
        ...s,
        _id: s._id.toString(),
      })),
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    });
  } catch (error) {
    console.error("[API /api/securities GET] ERROR:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch securities",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
