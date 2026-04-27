import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "franchise-docs");
const PUBLIC_PREFIX = "/uploads/franchise-docs/";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return errorResponse("Too many requests", 429);
    }

    const form = await request.formData();
    const file = form.get("file");
    const docType = form.get("docType");

    if (!(file instanceof File)) return errorResponse("No file provided", 400);
    if (!ALLOWED_TYPES.includes(file.type)) return errorResponse("Only images (JPG/PNG/WebP) and PDF allowed", 400);
    if (file.size > MAX_SIZE) return errorResponse("File too large (max 5MB)", 400);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name || "").toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const safeDocType = String(docType || "doc").replace(/[^a-z0-9_-]/gi, "").slice(0, 30);
    const filename = `${safeDocType}_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const absPath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(absPath, Buffer.from(await file.arrayBuffer()));

    return successResponse({ url: `${PUBLIC_PREFIX}${filename}`, name: file.name, type: file.type }, "Uploaded");
  } catch (err) {
    console.error("franchise-doc upload:", err);
    return errorResponse("Upload failed", 500);
  }
}
