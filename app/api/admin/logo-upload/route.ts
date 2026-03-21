import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { errorResponse, forbiddenResponse, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "userpanel", "logo");
const PUBLIC_PREFIX = "/uploads/userpanel/logo/";

function isLocalLogoUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(PUBLIC_PREFIX);
}

async function safeUnlink(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const form = await request.formData();
    const file = form.get("file");
    const oldUrl = form.get("oldUrl");
    const oldUrlStr = typeof oldUrl === "string" ? oldUrl : null;

    if (!(file instanceof File)) {
      return errorResponse("No file provided", 400);
    }

    if (!file.type?.startsWith("image/")) {
      return errorResponse("Only image files allowed (PNG, JPG, etc.)", 400);
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB for logo
    if (file.size > maxBytes) {
      return errorResponse("Logo too large (max 2MB)", 400);
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const extFromName = path.extname(file.name || "").toLowerCase();
    const ext = extFromName && extFromName.length <= 10 ? extFromName : "";
    const safeExt = ext || (file.type === "image/png" ? ".png" : file.type === "image/jpeg" ? ".jpg" : ".png");
    const filename = `logo_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    const absPath = path.join(UPLOAD_DIR, filename);

    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buf);

    if (isLocalLogoUrl(oldUrlStr) && oldUrlStr !== `${PUBLIC_PREFIX}${filename}`) {
      const oldAbs = path.join(process.cwd(), "public", oldUrlStr.replace(/^\//, ""));
      await safeUnlink(oldAbs);
    }

    return successResponse({ url: `${PUBLIC_PREFIX}${filename}` }, "Logo uploaded");
  } catch (err) {
    console.error("logo-upload POST:", err);
    return errorResponse("Upload failed", 500);
  }
}
