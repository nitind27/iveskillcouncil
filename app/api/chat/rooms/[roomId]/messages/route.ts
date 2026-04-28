import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

/** GET — fetch messages for a room (paginated) */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  // Verify membership
  const member = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return forbiddenResponse();

  const before = request.nextUrl.searchParams.get("before");
  const limit  = Math.min(50, parseInt(request.nextUrl.searchParams.get("limit") || "50"));

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: BigInt(roomId),
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Fetch sender names
  const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))].map(BigInt);
  const senders   = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, fullName: true, roleId: true },
  });
  const senderMap = Object.fromEntries(senders.map((s) => [s.id.toString(), s]));

  // Mark as read
  await prisma.chatRoomMember.update({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
    data: { lastReadAt: new Date() },
  });

  const data = messages.reverse().map((m) => ({
    id:        m.id.toString(),
    roomId:    m.roomId.toString(),
    senderId:  m.senderId.toString(),
    senderName: senderMap[m.senderId.toString()]?.fullName ?? "Unknown",
    senderRole: senderMap[m.senderId.toString()]?.roleId ?? 0,
    body:      m.body,
    msgType:   m.msgType,
    fileUrl:   m.fileUrl,
    createdAt: m.createdAt.toISOString(),
    isOwn:     m.senderId.toString() === user.id,
  }));

  return successResponse(data);
}

/** POST — send a message */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  // Verify membership
  const member = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return forbiddenResponse();

  const body = await request.json();
  const { text, msgType = "text", fileUrl } = body;

  if (!text?.trim() && msgType === "text") return errorResponse("Message cannot be empty", 400);

  const msg = await prisma.chatMessage.create({
    data: {
      roomId:   BigInt(roomId),
      senderId: uid,
      body:     String(text || "").trim(),
      msgType,
      fileUrl:  fileUrl || null,
    },
  });

  // Update room updatedAt
  await prisma.chatRoom.update({
    where: { id: BigInt(roomId) },
    data:  { updatedAt: new Date() },
  });

  const sender = await prisma.user.findUnique({
    where: { id: uid },
    select: { fullName: true, roleId: true },
  });

  return successResponse({
    id:         msg.id.toString(),
    roomId:     msg.roomId.toString(),
    senderId:   msg.senderId.toString(),
    senderName: sender?.fullName ?? "Unknown",
    senderRole: sender?.roleId ?? 0,
    body:       msg.body,
    msgType:    msg.msgType,
    fileUrl:    msg.fileUrl,
    createdAt:  msg.createdAt.toISOString(),
    isOwn:      true,
  }, "Message sent");
}
