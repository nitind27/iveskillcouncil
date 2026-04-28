import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ roomId: string }> };

/** POST — add member to group room (admin only) */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (Number(user.roleId) !== ROLES.SUPER_ADMIN && Number(user.roleId) !== ROLES.ADMIN) return forbiddenResponse();

  const { roomId } = await params;
  const { userId } = await request.json();
  if (!userId) return errorResponse("userId required", 400);

  await prisma.chatRoomMember.upsert({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: BigInt(userId) } },
    create: { roomId: BigInt(roomId), userId: BigInt(userId) },
    update: {},
  });

  return successResponse(null, "Member added");
}

/** DELETE — remove member from group room */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (Number(user.roleId) !== ROLES.SUPER_ADMIN && Number(user.roleId) !== ROLES.ADMIN) return forbiddenResponse();

  const { roomId } = await params;
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return errorResponse("userId required", 400);

  await prisma.chatRoomMember.deleteMany({
    where: { roomId: BigInt(roomId), userId: BigInt(userId) },
  });

  return successResponse(null, "Member removed");
}
