import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".pdf":  "application/pdf",
  ".ico":  "image/x-icon",
};

/**
 * GET /api/uploads/[...path]
 * Serves files from public/uploads/ — needed for production where
 * Next.js does not serve dynamically created files from public/.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;

    // Security: block path traversal
    const joined = segments.join("/");
    if (joined.includes("..") || joined.includes("~")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", ...segments);

    // Ensure it stays within public/uploads
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    if (!filePath.startsWith(uploadsRoot)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
