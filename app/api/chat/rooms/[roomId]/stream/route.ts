import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type Params = { params: Promise<{ roomId: string }> };

/**
 * GET /api/chat/rooms/[roomId]/stream
 * Server-Sent Events — streams new messages to the client in real time.
 * Client connects once; server pushes new messages as they arrive.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const uid = BigInt(user.id);
  const { roomId } = await params;

  // Verify membership
  const member = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: BigInt(roomId), userId: uid } },
  });
  if (!member) return new Response("Forbidden", { status: 403 });

  let lastId = BigInt(0);
  let closed = false;

  // Get the latest message id as starting point
  const latest = await prisma.chatMessage.findFirst({
    where: { roomId: BigInt(roomId) },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (latest) lastId = latest.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode(": ping\n\n"));

      const poll = async () => {
        if (closed) return;
        try {
          const newMsgs = await prisma.chatMessage.findMany({
            where: { roomId: BigInt(roomId), id: { gt: lastId } },
            orderBy: { id: "asc" },
            take: 20,
          });

          if (newMsgs.length > 0) {
            const senderIds = [...new Set(newMsgs.map((m) => m.senderId.toString()))].map(BigInt);
            const senders   = await prisma.user.findMany({
              where: { id: { in: senderIds } },
              select: { id: true, fullName: true, roleId: true },
            });
            const senderMap = Object.fromEntries(senders.map((s) => [s.id.toString(), s]));

            for (const msg of newMsgs) {
              const payload = JSON.stringify({
                id:         msg.id.toString(),
                roomId:     msg.roomId.toString(),
                senderId:   msg.senderId.toString(),
                senderName: senderMap[msg.senderId.toString()]?.fullName ?? "Unknown",
                senderRole: senderMap[msg.senderId.toString()]?.roleId ?? 0,
                body:       msg.body,
                msgType:    msg.msgType,
                fileUrl:    msg.fileUrl,
                createdAt:  msg.createdAt.toISOString(),
                isOwn:      msg.senderId.toString() === user.id,
              });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
              lastId = msg.id;
            }
          } else {
            // Heartbeat every cycle
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }
        } catch {
          // DB error — keep polling
        }

        if (!closed) setTimeout(poll, 2000); // poll every 2s
      };

      setTimeout(poll, 500);

      // Abort when client disconnects
      request.signal.addEventListener("abort", () => {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
