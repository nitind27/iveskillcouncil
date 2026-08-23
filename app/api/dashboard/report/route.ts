import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { unauthorizedResponse, errorResponse, successResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";
import {
  buildDashboardReport,
  resolveDateRange,
  resolveFranchiseId,
} from "@/lib/dashboard-report-data";
import { buildDashboardExcel, buildDashboardPdf } from "@/lib/dashboard-report-export";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const sp = request.nextUrl.searchParams;
    const format = (sp.get("format") || "json").toLowerCase(); // json | excel | pdf
    const tab = sp.get("tab") || "analytics";
    const range = sp.get("range") || "30d";
    const fromStr = sp.get("from");
    const toStr = sp.get("to");
    const status = sp.get("status") || "ALL";
    const franchiseRequested = sp.get("franchiseId");

    const { from, to, rangeLabel } = resolveDateRange(range, fromStr, toStr);
    const franchiseId = resolveFranchiseId(
      { id: user.id, roleId: user.roleId, franchiseId: user.franchiseId },
      franchiseRequested
    );

    const report = await buildDashboardReport(
      { id: user.id, roleId: user.roleId, franchiseId: user.franchiseId },
      { franchiseId, from, to, status, tab: tab as "overview" | "analytics" | "activity" }
    );

    let franchiseLabel = "All Franchises";
    if (franchiseId) {
      const f = await prisma.franchise.findUnique({
        where: { id: BigInt(franchiseId) },
        select: { name: true },
      });
      franchiseLabel = f?.name || `Franchise #${franchiseId}`;
    }

    const statusLabel =
      status === "ALL" ? "All Payment Statuses" : status.charAt(0) + status.slice(1).toLowerCase();

    const meta = {
      tab,
      rangeLabel,
      franchiseLabel,
      generatedBy: user.fullName || user.email,
      statusLabel,
      orgName: process.env.APP_NAME || "IVESDC",
      orgTagline: "Institute of Vocational Education & Skill Development Council",
    };

    const stamp = new Date().toISOString().slice(0, 10);
    const safeTab = tab.replace(/[^a-z]/gi, "-");

    if (format === "excel" || format === "xls") {
      const buf = buildDashboardExcel(report, meta);
      const filename = `IVESDC-${safeTab}-Report-${stamp}.xls`;
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (format === "pdf") {
      const buf = await buildDashboardPdf(report, meta);
      const filename = `IVESDC-${safeTab}-Report-${stamp}.pdf`;
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return successResponse({ ...report, meta }, "Dashboard report retrieved");
  } catch (error: unknown) {
    console.error("Dashboard report error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to build report", 500);
  }
}
