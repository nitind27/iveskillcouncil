import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { SHARE_COOKIE } from "@/lib/certificate-share";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  _context: { params: Promise<{ token: string }> }
) {
  const res = successResponse({ signedOut: true });
  res.cookies.set(SHARE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
