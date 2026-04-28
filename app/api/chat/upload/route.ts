import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { getCurrentUser } from "@/lib/api-auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

const UPLOAD_DIR    = path.join(process.cwd(), "public", "uploads", "chat");
const PUBLIC_PREFIX = "/uploads/chat/";
const MAX_SIZE      = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "image", "image/png": "image", "image/webp": "image",
  "image/gif": "image",  "image/svg+xml": "image",
  "application/pdf": "file",
  "application/msword": "file",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file",
  "application/vnd.ms-excel": "file",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file",
  "text/plain": "file",
  "application/zip": "file",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const form = await request.formData();
  const files = form.getAll("files") as File[];

  if (!files.length) return errorResponse("No files provided", 400);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const results: { url: string; name: string; msgType: string; size: number }[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (file.size > MAX_SIZE) return errorResponse(`${file.name} exceeds 10MB limit`, 400);

    const msgType = ALLOWED_TYPES[file.type];
    if (!msgType) return errorResponse(`File type ${file.type} not allowed`, 400);

    const ext      = path.extname(file.name || "").toLowerCase() || ".bin";
    const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const absPath  = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(absPath, Buffer.from(await file.arrayBuffer()));

    results.push({
      url:     `${PUBLIC_PREFIX}${filename}`,
      name:    file.name,
      msgType,
      size:    file.size,
    });
  }

  return successResponse(results, "Uploaded");
}
