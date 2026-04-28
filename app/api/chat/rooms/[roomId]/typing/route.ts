import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ roomId: string }> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

/** POST — set typing status (call while typing, stop calling to clear) */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  const member = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return forbiddenResponse();

  const { typing } = await request.json();

  if (typing) {
    await db.chatTyping.upsert({
      where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
      create: { roomId: BigInt(roomId), userId: uid, userName: user.fullName ?? "Someone" },
      update: { userName: user.fullName ?? "Someone" },
    });
  } else {
    await db.chatTyping.deleteMany({ where: { roomId: BigInt(roomId), userId: uid } });
  }

  return successResponse(null);
}

/** GET — get who is typing (exclude self, only recent < 5s) */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  const cutoff = new Date(Date.now() - 5000); // 5 seconds
  const typingUsers = await db.chatTyping.findMany({
    where: {
      roomId:    BigInt(roomId),
      userId:    { not: uid },
      updatedAt: { gte: cutoff },
    },
  });

  return successResponse(typingUsers.map((t: any) => t.userName));
}
