import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    const assetType = form.get("assetType") || "logo"; // logo | banner | stamp

    if (!(file instanceof File)) return errorResponse("No file provided", 400);
    if (!file.type?.startsWith("image/")) return errorResponse("Only image files allowed", 400);
    if (file.size > 3 * 1024 * 1024) return errorResponse("Max 3MB", 400);

    const dir = path.join(process.cwd(), "public", "uploads", "franchise-panels", id);
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(file.name || "").toLowerCase() || ".png";
    const filename = `${assetType}_${Date.now()}${ext}`;
    await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

    return successResponse({ url: `/uploads/franchise-panels/${id}/${filename}` }, "Uploaded");
  } catch (err) {
    console.error("upload-panel-asset:", err);
    return errorResponse("Upload failed", 500);
  }
}
