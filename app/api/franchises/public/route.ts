import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** Public API - no auth. Returns ACTIVE franchises for userpanel display. */
export async function GET() {
  try {
    const franchises = await prisma.franchise.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: {
        owner: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    const data = franchises.map((f) => ({
      id: f.id.toString(),
      name: f.name,
      address: f.address,
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      head: f.owner.fullName,
      contact: f.owner.phone || "",
      email: f.owner.email,
      plan: f.plan.name,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Public franchises API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch franchises" },
      { status: 500 }
    );
  }
}
