import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { requireSuperAdmin } from "@/lib/api-auth";
import { errorResponse, forbiddenResponse, unauthorizedResponse, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "userpanel", "welcome");
const PUBLIC_PREFIX = "/uploads/userpanel/welcome/";

function isLocalWelcomeUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(PUBLIC_PREFIX);
}

async function safeUnlink(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore missing/locked file
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    if (!user) {
      // If authenticated but not super admin, requireSuperAdmin returns null.
      // We keep response strict for security.
      return forbiddenResponse();
    }

    const form = await request.formData();
    const file = form.get("file");
    const oldUrl = form.get("oldUrl");

    const oldUrlStr = typeof oldUrl === "string" ? oldUrl : null;

    if (!(file instanceof File)) {
      return errorResponse("No file provided", 400);
    }

    if (!file.type?.startsWith("image/")) {
      return errorResponse("Only image files are allowed", 400);
    }

    // Limit ~5MB to avoid huge uploads to local disk
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return errorResponse("Image too large (max 5MB)", 400);
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const extFromName = path.extname(file.name || "").toLowerCase();
    const ext = extFromName && extFromName.length <= 10 ? extFromName : "";
    const safeExt = ext || (file.type === "image/png" ? ".png" : file.type === "image/jpeg" ? ".jpg" : ".img");
    const filename = `welcome_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    const absPath = path.join(UPLOAD_DIR, filename);

    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buf);

    // Delete old local file if it was previously uploaded through this system
    if (isLocalWelcomeUrl(oldUrlStr) && oldUrlStr !== `${PUBLIC_PREFIX}${filename}`) {
      const oldAbs = path.join(process.cwd(), "public", oldUrlStr.replace(/^\//, ""));
      await safeUnlink(oldAbs);
    }

    return successResponse(
      {
        url: `${PUBLIC_PREFIX}${filename}`,
      },
      "Uploaded"
    );
  } catch (err) {
    console.error("welcome-popup-image POST:", err);
    return errorResponse("Upload failed", 500);
  }
}

