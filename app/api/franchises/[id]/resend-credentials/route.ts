import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { sendFranchiseCredentialsEmail } from "@/lib/email";
import { generateFranchiseCredentialsPdf } from "@/lib/franchise-credentials-pdf";

export const dynamic = "force-dynamic";

function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length];
  return s;
}

/** POST: Resend credentials to franchise owner. Generates new password, sends email + PDF. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdminOrAdmin();
    if (!admin) return forbiddenResponse();

    const { id } = await params;
    const franchiseId = BigInt(id);

    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        owner: true,
        plan: true,
      },
    });

    if (!franchise) return notFoundResponse();

    const plainPassword = generatePassword(12);
    const hashedPassword = await hashPassword(plainPassword);

    await prisma.user.update({
      where: { id: franchise.ownerId },
      data: { password: hashedPassword, mustChangePassword: true },
    });

    const loginUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`}/login`
        : "https://example.com/login";

    const appName = process.env.APP_NAME || "Franchise Institute";
    const subStart = franchise.subscriptionStart.toLocaleDateString();
    const subEnd = franchise.subscriptionEnd.toLocaleDateString();

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateFranchiseCredentialsPdf({
        franchiseName: franchise.name,
        franchiseId: franchise.id.toString(),
        ownerName: franchise.owner.fullName,
        email: franchise.owner.email,
        phone: franchise.owner.phone,
        planName: franchise.plan.name,
        subscriptionStart: subStart,
        subscriptionEnd: subEnd,
        address: franchise.address,
        city: franchise.city,
        state: franchise.state,
        pincode: franchise.pincode,
        loginUrl,
        appName,
      });
    } catch (pdfErr) {
      console.warn("Resend credentials PDF failed:", pdfErr);
    }

    const emailResult = await sendFranchiseCredentialsEmail(franchise.owner.email, {
      franchiseName: franchise.name,
      franchiseId: franchise.id.toString(),
      loginUrl,
      email: franchise.owner.email,
      password: plainPassword,
      planName: franchise.plan.name,
      ownerName: franchise.owner.fullName,
      phone: franchise.owner.phone,
      subscriptionStart: subStart,
      subscriptionEnd: subEnd,
      address: franchise.address,
      city: franchise.city,
      state: franchise.state,
      pincode: franchise.pincode,
      pdfBuffer,
      firstTimeSetup: true,
    });

    return successResponse(
      {
        emailSent: emailResult.success,
        emailError: emailResult.error,
        credentials: {
          email: franchise.owner.email,
          password: plainPassword,
          loginUrl,
        },
      },
      emailResult.success ? "Credentials sent to owner email" : "New password generated. Email failed - copy and share manually."
    );
  } catch (err) {
    console.error("Resend credentials error:", err);
    return errorResponse("Failed to resend credentials", 500);
  }
}
