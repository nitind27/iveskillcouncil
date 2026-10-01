import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import {
  SIGNATURE_SLOTS,
  SLOT_FIELD,
  getFranchiseSignatures,
  updateFranchiseSignatures,
  type SignatureSlot,
} from "@/lib/franchise-document-signatures";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};
const MAX_BYTES = 2 * 1024 * 1024;

/** SUB_ADMIN → own franchise only; ADMIN / SUPER_ADMIN → any franchise via ?franchiseId= */
async function resolveFranchise(requested: string | null) {
  const user = await getCurrentUser();
  if (!user) return { error: unauthorizedResponse() };
  const roleId = Number(user.roleId);

  let franchiseId: string | null = null;
  if (roleId === ROLES.SUB_ADMIN) {
    franchiseId = user.franchiseId ? String(user.franchiseId) : null;
  } else if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) {
    franchiseId = requested && /^\d+$/.test(requested) ? requested : null;
  } else {
    return { error: errorResponse("Forbidden", 403) };
  }
  if (!franchiseId) return { error: errorResponse("Franchise is required", 400) };

  const franchise = await prisma.franchise.findUnique({
    where: { id: BigInt(franchiseId) },
    select: { id: true, name: true, slug: true },
  });
  if (!franchise) return { error: errorResponse("Franchise not found", 404) };
  return { franchise };
}

function payload(franchise: { id: bigint; name: string; slug: string | null }, signatures: object) {
  return { franchiseId: franchise.id.toString(), franchiseName: franchise.name, signatures };
}

export async function GET(request: NextRequest) {
  try {
    const r = await resolveFranchise(request.nextUrl.searchParams.get("franchiseId"));
    if ("error" in r) return r.error;
    return successResponse(payload(r.franchise, await getFranchiseSignatures(r.franchise.id)));
  } catch (err) {
    console.error("GET document-signatures", err);
    return errorResponse("Failed to load signatures", 500);
  }
}

/** multipart: file, slot (atcStamp | atcSignature | coordinatorSignature), franchiseId (admin) */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const r = await resolveFranchise(String(form.get("franchiseId") || "") || null);
    if ("error" in r) return r.error;

    const slot = String(form.get("slot") || "") as SignatureSlot;
    if (!SIGNATURE_SLOTS.includes(slot)) return errorResponse("Invalid slot", 400);

    const file = form.get("file");
    if (!(file instanceof File)) return errorResponse("No file provided", 400);
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) return errorResponse("Only PNG, JPG or WEBP images are allowed", 400);
    if (file.size > MAX_BYTES) return errorResponse("Image must be 2 MB or smaller", 400);

    const id = r.franchise.id.toString();
    const dir = path.join(process.cwd(), "public", "uploads", "franchise-signatures", id);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${slot}_${Date.now()}${ext}`;
    await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

    const previous = (await getFranchiseSignatures(id))[SLOT_FIELD[slot]];
    const signatures = await updateFranchiseSignatures(id, {
      [SLOT_FIELD[slot]]: `/uploads/franchise-signatures/${id}/${filename}`,
    });
    if (typeof previous === "string" && previous.startsWith(`/uploads/franchise-signatures/${id}/`)) {
      await fs.unlink(path.join(dir, path.basename(previous))).catch(() => undefined);
    }

    return successResponse(payload(r.franchise, signatures), "Uploaded");
  } catch (err) {
    console.error("POST document-signatures", err);
    return errorResponse("Upload failed", 500);
  }
}

/** JSON: { franchiseId?, atcSignatoryName?, coordinatorName? } */
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const r = await resolveFranchise(body.franchiseId ? String(body.franchiseId) : null);
    if ("error" in r) return r.error;

    const clean = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 80) : undefined);
    const patch: Record<string, string | undefined> = {};
    if ("atcSignatoryName" in body) patch.atcSignatoryName = clean(body.atcSignatoryName) ?? "";
    if ("coordinatorName" in body) patch.coordinatorName = clean(body.coordinatorName) ?? "";

    const signatures = await updateFranchiseSignatures(r.franchise.id, patch);
    return successResponse(payload(r.franchise, signatures), "Saved");
  } catch (err) {
    console.error("PATCH document-signatures", err);
    return errorResponse("Save failed", 500);
  }
}

/** ?slot=…&franchiseId=… — remove one uploaded image */
export async function DELETE(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const r = await resolveFranchise(sp.get("franchiseId"));
    if ("error" in r) return r.error;

    const slot = String(sp.get("slot") || "") as SignatureSlot;
    if (!SIGNATURE_SLOTS.includes(slot)) return errorResponse("Invalid slot", 400);

    const id = r.franchise.id.toString();
    const previous = (await getFranchiseSignatures(id))[SLOT_FIELD[slot]];
    const signatures = await updateFranchiseSignatures(id, { [SLOT_FIELD[slot]]: "" });
    if (typeof previous === "string" && previous.startsWith(`/uploads/franchise-signatures/${id}/`)) {
      const file = path.join(process.cwd(), "public", "uploads", "franchise-signatures", id, path.basename(previous));
      await fs.unlink(file).catch(() => undefined);
    }
    return successResponse(payload(r.franchise, signatures), "Removed");
  } catch (err) {
    console.error("DELETE document-signatures", err);
    return errorResponse("Remove failed", 500);
  }
}
