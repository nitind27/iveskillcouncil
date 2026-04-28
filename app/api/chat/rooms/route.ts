import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET — list all rooms the current user is a member of */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const memberships = await db.chatRoomMember.findMany({
    where: { userId: uid },
    include: {
      room: {
        include: {
          members: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { room: { updatedAt: "desc" } },
  });

  // Collect all user IDs we need
  const allUserIds = new Set<string>();
  for (const m of memberships) {
    for (const mb of m.room.members) allUserIds.add(mb.userId.toString());
    if (m.room.messages[0]) allUserIds.add(m.room.messages[0].senderId.toString());
  }

  const memberUsers = allUserIds.size
    ? await prisma.user.findMany({
        where: { id: { in: [...allUserIds].map(BigInt) } },
        select: { id: true, fullName: true, roleId: true },
      })
    : [];
  const userMap = Object.fromEntries(memberUsers.map((u) => [u.id.toString(), u]));

  const rooms = memberships.map((m: any) => {
    const room = m.room;
    const otherMembers = room.members
      .filter((mb: any) => mb.userId.toString() !== uid.toString())
      .map((mb: any) => userMap[mb.userId.toString()])
      .filter(Boolean);

    const displayName =
      room.type === "direct"
        ? otherMembers[0]?.fullName ?? "Unknown"
        : room.name ?? "Group";

    const lastMsg = room.messages[0];
    const myMembership = room.members.find((mb: any) => mb.userId.toString() === uid.toString());
    const unreadCount =
      lastMsg && (!myMembership?.lastReadAt || lastMsg.createdAt > myMembership.lastReadAt) ? 1 : 0;

    return {
      id: room.id.toString(),
      type: room.type,
      name: displayName,
      slug: room.slug,
      lastMessage: lastMsg
        ? {
            body: lastMsg.body,
            senderId: lastMsg.senderId.toString(),
            senderName: userMap[lastMsg.senderId.toString()]?.fullName ?? "Unknown",
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      members: otherMembers.map((u: any) => ({
        id: u.id.toString(),
        fullName: u.fullName,
        roleId: u.roleId,
      })),
      updatedAt: room.updatedAt.toISOString(),
    };
  });

  return successResponse(rooms);
}

/** POST — create or get a direct room, or create a group room */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const body = await request.json();
  const { type, targetUserId, name, memberIds } = body;

  if (type === "direct") {
    if (!targetUserId) return errorResponse("targetUserId required", 400);
    const tid  = BigInt(targetUserId);
    const slug = [uid, tid].map(String).sort().join("_");

    const existing = await db.chatRoom.findUnique({ where: { slug } });
    if (existing) {
      return successResponse({ id: existing.id.toString(), slug, type: "direct", isNew: false });
    }

    const room = await db.chatRoom.create({
      data: {
        type: "direct",
        slug,
        createdBy: uid,
        members: { create: [{ userId: uid }, { userId: tid }] },
      },
    });
    return successResponse({ id: room.id.toString(), slug, type: "direct", isNew: true });
  }

  if (type === "group") {
    if (!name?.trim()) return errorResponse("name required for group", 400);
    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN) {
      return errorResponse("Only admins can create group rooms", 403);
    }

    const ids: bigint[] = [uid, ...(memberIds ?? []).map(BigInt)];
    const room = await db.chatRoom.create({
      data: {
        type: "group",
        name: String(name).trim(),
        createdBy: uid,
        members: { create: ids.map((userId: bigint) => ({ userId })) },
      },
    });
    return successResponse({ id: room.id.toString(), type: "group", name: room.name, isNew: true });
  }

  return errorResponse("type must be 'direct' or 'group'", 400);
}
