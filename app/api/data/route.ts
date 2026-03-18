import { NextRequest, NextResponse } from "next/server";
import { paginateData, validatePaginationParams } from "@/lib/api/utils";
import { ApiResponse, PaginatedResponse } from "@/lib/api/types";

// Mock data generator for demonstration
// In production, replace with actual database queries
function generateMockData(count: number = 100000) {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: i % 2 === 0 ? "active" : "inactive",
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    value: Math.floor(Math.random() * 10000),
  }));
}

// Cache mock data in memory (in production, use Redis or database)
let cachedData: any[] | null = null;

function getData() {
  if (!cachedData) {
    cachedData = generateMockData(100000);
  }
  return cachedData;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
    const search = searchParams.get("search") || undefined;

    // Validate pagination params
    const validatedParams = validatePaginationParams({ page, pageSize });

    // Get all data (in production, this would be a database query with LIMIT/OFFSET)
    const allData = getData();

    // Paginate data
    const result = paginateData(allData, {
      ...validatedParams,
      sortBy,
      sortOrder,
      search,
    });

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: result,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

