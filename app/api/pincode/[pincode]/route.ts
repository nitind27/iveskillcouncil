import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const PINCODE_API = "https://api.postalpincode.in/pincode";

/** GET /api/pincode/[pincode] – Free India pincode lookup; returns area, city (district), state */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  try {
    const { pincode } = await params;
    const trimmed = String(pincode || "").trim().replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      return errorResponse("Please enter a valid 6-digit pincode.", 400);
    }

    const res = await fetch(`${PINCODE_API}/${trimmed}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return errorResponse("Pincode service unavailable. Try again later.", 502);
    }

    const data = (await res.json()) as Array<{
      Status: string;
      PostOffice: Array<{
        Name: string;
        District: string;
        State: string;
        Block?: string;
      }> | null;
    }>;

    const first = data?.[0];
    if (!first || first.Status !== "Success" || !first.PostOffice?.length) {
      return successResponse(
        { area: "", city: "", state: "", found: false },
        "No details found for this pincode."
      );
    }

    const po = first.PostOffice[0];
    const area = po.Block || po.Name || "";
    const city = po.District || "";
    const state = po.State || "";

    return successResponse(
      { area, city, state, found: true },
      "Pincode details retrieved."
    );
  } catch (e) {
    console.error("Pincode API error:", e);
    return errorResponse("Failed to fetch pincode details.", 500);
  }
}
