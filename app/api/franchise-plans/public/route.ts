import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * GET /api/franchise-plans/public
 * Public endpoint — no auth required.
 * Returns ACTIVE subscription plans for the userpanel franchise-plans page.
 */
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
    });

    const data = plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      durationInDays: p.durationInDays,
      status: p.status,
    }));

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/franchise-plans/public", e);
    return NextResponse.json({ success: false, error: "Failed to fetch plans" }, { status: 500 });
  }
}
