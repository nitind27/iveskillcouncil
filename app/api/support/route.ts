import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateName, validateEmail } from "@/lib/validation";
import { getCurrentUser, requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** POST: Create support request (public). Sends email to SUPPORT_EMAIL. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = body?.fullName?.trim();
    const email = body?.email?.trim();
    const message = body?.message?.trim();
    const source = body?.source?.trim() || "login";

    if (!fullName || !email || !message) {
      return errorResponse("Name, email and message are required", 400);
    }
    const nameR = validateName(fullName);
    const emailR = validateEmail(email);
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);

    const record = await prisma.supportRequest.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        message: message.slice(0, 5000),
        source,
      },
    });

    const supportEmail = process.env.SUPPORT_EMAIL || "codeatinfotech@gmail.com";
    const appName = process.env.APP_NAME || "Institute";
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        },
      });
      const htmlMessage = (message || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      await transporter.sendMail({
        from: process.env.SMTP_USER || "noreply@example.com",
        to: supportEmail,
        replyTo: email,
        subject: `[${appName}] Support Request from ${fullName}`,
        text: `Support Request\n\nName: ${fullName}\nEmail: ${email}\nSource: ${source}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #1e40af;">New Support Request</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 8px;">${htmlMessage}</div>
            <p style="margin-top: 16px; font-size: 12px; color: #64748b;">View in Superadmin Panel: Dashboard → Support Requests</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Support email send failed:", mailErr);
    }

    return successResponse(
      { id: record.id.toString() },
      "Support request submitted. We will get back to you soon."
    );
  } catch (err) {
    console.error("Support API error:", err);
    return errorResponse("Failed to submit support request", 500);
  }
}

/** GET: List support requests (SUPER_ADMIN only). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const admin = await requireSuperAdminOrAdmin();
    if (!admin) return errorResponse("Forbidden", 403);

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const requests = await prisma.supportRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const data = requests.map((r) => ({
      id: r.id.toString(),
      fullName: r.fullName,
      email: r.email,
      message: r.message,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    }));

    return successResponse(data, "Support requests retrieved");
  } catch (err) {
    console.error("Support GET error:", err);
    return errorResponse("Failed to fetch support requests", 500);
  }
}
