import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";
type Params = { params: Promise<{ roomId: string }> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const uid = BigInt(user.id);
  const { roomId } = await params;

  const member = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return new Response("Forbidden", { status: 403 });

  let lastMsgId = BigInt(0);
  let lastEditCheck = new Date();
  let closed = false;

  const latest = await db.chatMessage.findFirst({
    where: { roomId: BigInt(roomId) },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (latest) lastMsgId = latest.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      };

      send("connected", { roomId });

      const poll = async () => {
        if (closed) return;
        try {
          // 1. New messages
          const newMsgs = await db.chatMessage.findMany({
            where: { roomId: BigInt(roomId), id: { gt: lastMsgId } },
            orderBy: { id: "asc" },
            take: 30,
          });

          if (newMsgs.length > 0) {
            const senderIds = [...new Set(newMsgs.map((m: any) => m.senderId.toString()))].map(BigInt);
            const senders   = await prisma.user.findMany({
              where: { id: { in: senderIds } },
              select: { id: true, fullName: true, roleId: true },
            });
            const senderMap = Object.fromEntries(senders.map((s) => [s.id.toString(), s]));

            for (const msg of newMsgs) {
              const sender = senderMap[msg.senderId.toString()];
              send("message", {
                id:            msg.id.toString(),
                roomId:        msg.roomId.toString(),
                senderId:      msg.senderId.toString(),
                senderName:    sender?.fullName ?? "Unknown",
                senderRole:    sender?.roleId ?? 0,
                body:          msg.isDeleted ? "This message was deleted" : msg.body,
                msgType:       msg.isDeleted ? "deleted" : msg.msgType,
                fileUrl:       msg.isDeleted ? null : msg.fileUrl,
                fileName:      msg.isDeleted ? null : msg.fileName,
                replyToId:     msg.replyToId?.toString() ?? null,
                replyToBody:   msg.replyToBody,
                replyToSender: msg.replyToSender,
                isEdited:      msg.isEdited,
                editedAt:      msg.editedAt?.toISOString() ?? null,
                isDeleted:     msg.isDeleted,
                createdAt:     msg.createdAt.toISOString(),
                isOwn:         msg.senderId.toString() === user.id,
              });
              lastMsgId = msg.id;
            }
          }

          // 2. Edited/deleted messages since last check
          const editedMsgs = await db.chatMessage.findMany({
            where: {
              roomId:    BigInt(roomId),
              editedAt:  { gte: lastEditCheck },
              isEdited:  true,
            },
            orderBy: { editedAt: "asc" },
            take: 20,
          });
          for (const msg of editedMsgs) {
            send("edited", {
              id:        msg.id.toString(),
              body:      msg.isDeleted ? "This message was deleted" : msg.body,
              isEdited:  msg.isEdited,
              editedAt:  msg.editedAt?.toISOString() ?? null,
              isDeleted: msg.isDeleted,
            });
          }

          // 3. Typing indicators
          const cutoff = new Date(Date.now() - 5000);
          const typing = await db.chatTyping.findMany({
            where: { roomId: BigInt(roomId), userId: { not: uid }, updatedAt: { gte: cutoff } },
          });
          send("typing", typing.map((t: any) => t.userName));

          lastEditCheck = new Date();
        } catch { /* keep polling */ }

        if (!closed) setTimeout(poll, 1500);
      };

      setTimeout(poll, 300);

      request.signal.addEventListener("abort", () => {
        closed = true;
        // Clear typing on disconnect
        db.chatTyping.deleteMany({ where: { roomId: BigInt(roomId), userId: uid } }).catch(() => {});
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() { closed = true; },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
