import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { errorResponse, forbiddenResponse, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "userpanel", "notices");
const PUBLIC_PREFIX = "/uploads/userpanel/notices/";
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorResponse("No file provided", 400);
    if (file.type && file.type !== "application/pdf") return errorResponse("Only PDF files are allowed", 400);
    if (file.size > MAX_BYTES) return errorResponse("PDF too large (max 8MB)", 400);

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.subarray(0, 5).toString() !== "%PDF-") return errorResponse("Only PDF files are allowed", 400);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `notice_${Date.now()}_${Math.random().toString(16).slice(2)}.pdf`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);

    return successResponse({ url: `${PUBLIC_PREFIX}${filename}` }, "Uploaded");
  } catch (err) {
    console.error("notice-pdf POST:", err);
    return errorResponse("Upload failed", 500);
  }
}
