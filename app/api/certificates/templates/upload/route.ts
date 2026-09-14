import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "certificates");
const PUBLIC_PREFIX = "/uploads/certificates/";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
]);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const categoryRaw = form.get("category");
    const category = typeof categoryRaw === "string" && categoryRaw.trim()
      ? categoryRaw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
      : "asset";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const mime = file.type?.toLowerCase() || "";
    const extFromName = path.extname(file.name || "").toLowerCase();

    const isValidMime = ALLOWED_MIME_TYPES.has(mime);
    const isValidExt = ALLOWED_EXTENSIONS.has(extFromName);

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        {
          success: false,
          error: "Only image files (PNG, JPG, WEBP, SVG, GIF) are allowed",
        },
        { status: 400 }
      );
    }

    const maxBytes = 12 * 1024 * 1024; // 12MB max for high-res templates & borders
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, error: "File exceeds 12MB size limit" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const safeExt = isValidExt ? extFromName : ".png";
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${category}-${timestamp}-${randomSuffix}${safeExt}`;
    const destinationPath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destinationPath, buffer);

    const publicUrl = `${PUBLIC_PREFIX}${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      category,
      message: "File uploaded and saved successfully",
    });
  } catch (error) {
    console.error("Certificate upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
