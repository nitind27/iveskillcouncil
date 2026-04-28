import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ roomId: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

function serializeMsg(m: any, userId: string, senderMap: Record<string, any>) {
  const sender = senderMap[m.senderId.toString()];
  return {
    id:             m.id.toString(),
    roomId:         m.roomId.toString(),
    senderId:       m.senderId.toString(),
    senderName:     sender?.fullName ?? "Unknown",
    senderRole:     sender?.roleId ?? 0,
    body:           m.isDeleted ? "This message was deleted" : m.body,
    msgType:        m.isDeleted ? "deleted" : m.msgType,
    fileUrl:        m.isDeleted ? null : m.fileUrl,
    fileName:       m.isDeleted ? null : m.fileName,
    replyToId:      m.replyToId?.toString() ?? null,
    replyToBody:    m.replyToBody,
    replyToSender:  m.replyToSender,
    isEdited:       m.isEdited,
    editedAt:       m.editedAt?.toISOString() ?? null,
    isDeleted:      m.isDeleted,
    createdAt:      m.createdAt.toISOString(),
    isOwn:          m.senderId.toString() === userId,
  };
}

/** GET — fetch messages */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  const member = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return forbiddenResponse();

  const before = request.nextUrl.searchParams.get("before");
  const limit  = Math.min(60, parseInt(request.nextUrl.searchParams.get("limit") || "60"));

  const messages = await db.chatMessage.findMany({
    where: {
      roomId: BigInt(roomId),
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const senderIds = [...new Set(messages.map((m: any) => m.senderId.toString()))].map(BigInt);
  const senders   = senderIds.length
    ? await prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, fullName: true, roleId: true } })
    : [];
  const senderMap = Object.fromEntries(senders.map((s) => [s.id.toString(), s]));

  // Mark as read
  await db.chatRoomMember.update({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
    data: { lastReadAt: new Date() },
  });

  return successResponse(messages.reverse().map((m: any) => serializeMsg(m, user.id, senderMap)));
}

/** POST — send a message (text / image / file / multiple files) */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  const member = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return forbiddenResponse();

  const body = await request.json();
  const { text, msgType = "text", fileUrl, fileName, replyToId } = body;

  if (!text?.trim() && msgType === "text") return errorResponse("Message cannot be empty", 400);

  // Resolve reply info
  let replyToBody: string | null = null;
  let replyToSender: string | null = null;
  if (replyToId) {
    const orig = await db.chatMessage.findUnique({ where: { id: BigInt(replyToId) } });
    if (orig) {
      replyToBody   = orig.isDeleted ? "Deleted message" : orig.body.slice(0, 200);
      const origSender = await prisma.user.findUnique({ where: { id: orig.senderId }, select: { fullName: true } });
      replyToSender = origSender?.fullName ?? "Unknown";
    }
  }

  const msg = await db.chatMessage.create({
    data: {
      roomId:       BigInt(roomId),
      senderId:     uid,
      body:         String(text || "").trim(),
      msgType,
      fileUrl:      fileUrl || null,
      fileName:     fileName || null,
      replyToId:    replyToId ? BigInt(replyToId) : null,
      replyToBody,
      replyToSender,
    },
  });

  await db.chatRoom.update({ where: { id: BigInt(roomId) }, data: { updatedAt: new Date() } });

  const sender = await prisma.user.findUnique({ where: { id: uid }, select: { fullName: true, roleId: true } });
  const senderMap = { [uid.toString()]: { fullName: sender?.fullName ?? "Unknown", roleId: sender?.roleId ?? 0 } };

  return successResponse(serializeMsg(msg, user.id, senderMap), "Message sent");
}

/** PATCH — edit a message */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  const body = await request.json();
  const { messageId, newText } = body;
  if (!messageId || !newText?.trim()) return errorResponse("messageId and newText required", 400);

  const msg = await db.chatMessage.findUnique({ where: { id: BigInt(messageId) } });
  if (!msg) return errorResponse("Message not found", 404);
  if (msg.senderId.toString() !== uid.toString()) return forbiddenResponse();
  if (msg.isDeleted) return errorResponse("Cannot edit deleted message", 400);

  const updated = await db.chatMessage.update({
    where: { id: BigInt(messageId) },
    data: { body: String(newText).trim(), isEdited: true, editedAt: new Date() },
  });

  const sender = await prisma.user.findUnique({ where: { id: uid }, select: { fullName: true, roleId: true } });
  const senderMap = { [uid.toString()]: { fullName: sender?.fullName ?? "Unknown", roleId: sender?.roleId ?? 0 } };

  return successResponse(serializeMsg(updated, user.id, senderMap), "Message edited");
}

/** DELETE — soft-delete a message */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const { roomId } = await params;

  const messageId = request.nextUrl.searchParams.get("messageId");
  if (!messageId) return errorResponse("messageId required", 400);

  const msg = await db.chatMessage.findUnique({ where: { id: BigInt(messageId) } });
  if (!msg) return errorResponse("Message not found", 404);
  if (msg.senderId.toString() !== uid.toString()) return forbiddenResponse();

  await db.chatMessage.update({
    where: { id: BigInt(messageId) },
    data: { isDeleted: true },
  });

  return successResponse({ id: messageId, isDeleted: true }, "Message deleted");
}
