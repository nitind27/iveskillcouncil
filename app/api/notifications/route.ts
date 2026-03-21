import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser, requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export interface NotificationItem {
  id: string;
  type: "course_enquiry" | "offer_application" | "franchise_inquiry" | "pending_franchise" | "certificate_request" | "feedback" | "support_request" | "announcement";
  title: string;
  message: string;
  href: string;
  createdAt: string;
  unread: boolean;
  meta?: Record<string, unknown>;
}

const RECENT_MS = 24 * 60 * 60 * 1000; // 24 hours = unread
const LIMIT = 50;

function isRecent(createdAt: Date): boolean {
  return Date.now() - new Date(createdAt).getTime() < RECENT_MS;
}

/** GET: Aggregated live notifications for the current user (role-based). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const notifications: NotificationItem[] = [];
    const roleId = Number(user.roleId);
    const franchiseId = user.franchiseId ? String(user.franchiseId) : null;

    // SUPER_ADMIN: Course enquiries, offer applications, franchise inquiries, pending franchises
    if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) {
      const superAdmin = await requireSuperAdminOrAdmin();
      if (superAdmin) {
        // Course enquiries
        try {
          const enquiries = await prisma.courseEnrollmentRequest.findMany({
            orderBy: { createdAt: "desc" },
            take: 15,
          });
          for (const e of enquiries) {
            notifications.push({
              id: `enq-${e.id}`,
              type: "course_enquiry",
              title: "New Course Enquiry",
              message: `${e.fullName} enquired for ${e.courseName}`,
              href: "/dashboard/enquiries",
              createdAt: e.createdAt.toISOString(),
              unread: isRecent(e.createdAt),
              meta: { email: e.email, phone: e.phone },
            });
          }
        } catch {
          // table may not exist
        }

        // Offer applications
        try {
          const offerModel = (prisma as { offerApplication?: { findMany: (opts: object) => Promise<unknown[]> } }).offerApplication;
          if (offerModel) {
            const apps = (await offerModel.findMany({
              orderBy: { createdAt: "desc" },
              take: 15,
            })) as { id: bigint; fullName: string; offerTitle: string; createdAt: Date }[];
            for (const a of apps) {
              notifications.push({
                id: `offer-${a.id}`,
                type: "offer_application",
                title: "New Offer Application",
                message: `${a.fullName} applied for ${a.offerTitle}`,
                href: "/dashboard/offer-applications",
                createdAt: a.createdAt.toISOString(),
                unread: isRecent(a.createdAt),
              });
            }
          }
        } catch {
          // table may not exist
        }

        // Franchise inquiries
        try {
          const franchiseInq = await prisma.franchiseInquiry.findMany({
            orderBy: { createdAt: "desc" },
            take: 15,
          });
          for (const f of franchiseInq) {
            notifications.push({
              id: `franchise-inq-${f.id}`,
              type: "franchise_inquiry",
              title: "New Franchise Inquiry",
              message: `${f.fullName} inquired about franchise${f.franchiseName ? ` (${f.franchiseName})` : ""}`,
              href: "/dashboard/franchise-inquiries",
              createdAt: f.createdAt.toISOString(),
              unread: isRecent(f.createdAt),
              meta: { city: f.city, investmentRange: f.investmentRange },
            });
          }
        } catch {
          // table may not exist
        }

        // Pending franchise approvals
        try {
          const pendingCount = await prisma.franchise.count({
            where: { status: "PENDING" },
          });
          if (pendingCount > 0) {
            notifications.push({
              id: "pending-franchises",
              type: "pending_franchise",
              title: "Pending Franchise Approvals",
              message: `${pendingCount} franchise(s) awaiting approval`,
              href: "/franchises/pending",
              createdAt: new Date().toISOString(),
              unread: true,
              meta: { count: pendingCount },
            });
          }
        } catch {
          // ignore
        }

        // Support requests
        try {
          const supportReqs = await prisma.supportRequest.findMany({
            orderBy: { createdAt: "desc" },
            take: 15,
          });
          for (const s of supportReqs) {
            notifications.push({
              id: `support-${s.id}`,
              type: "support_request",
              title: "Support Request",
              message: `${s.fullName}: ${s.message.slice(0, 60)}${s.message.length > 60 ? "..." : ""}`,
              href: "/dashboard/support",
              createdAt: s.createdAt.toISOString(),
              unread: isRecent(s.createdAt),
              meta: { email: s.email },
            });
          }
        } catch {
          // ignore
        }
      }
    }

    // SUB_ADMIN & ADMIN: Super Admin announcements - visible to all franchise admins
    if (roleId === ROLES.SUB_ADMIN || roleId === ROLES.ADMIN) {
      try {
        const announcements = await prisma.announcement.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { creator: { select: { fullName: true } } },
        });
        for (const a of announcements) {
          notifications.push({
            id: `announcement-${a.id}`,
            type: "announcement",
            title: a.title,
            message: a.message,
            href: "/announcements",
            createdAt: a.createdAt.toISOString(),
            unread: isRecent(a.createdAt),
            meta: { createdBy: a.creator.fullName },
          });
        }
      } catch {
        // table may not exist yet
      }
    }

    // ADMIN / SUB_ADMIN: Certificate requests, feedback (for their franchise)
    if (roleId === ROLES.ADMIN || roleId === ROLES.SUB_ADMIN) {
      const whereCert: { franchiseId?: bigint } = {};
      if (franchiseId) whereCert.franchiseId = BigInt(franchiseId);

      try {
        const certRequests = await prisma.certificate.findMany({
          where: { ...whereCert, status: "REQUESTED" },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { student: { include: { user: { select: { fullName: true } } } } },
        });
        for (const c of certRequests) {
          notifications.push({
            id: `cert-${c.id}`,
            type: "certificate_request",
            title: "Certificate Request",
            message: `${c.student.user.fullName} requested a certificate`,
            href: "/certificates/requests",
            createdAt: c.createdAt.toISOString(),
            unread: isRecent(c.createdAt),
          });
        }
      } catch {
        // ignore
      }

      const whereFeedback: { franchiseId?: bigint } = {};
      if (franchiseId) whereFeedback.franchiseId = BigInt(franchiseId);

      try {
        const feedbacks = await prisma.feedback.findMany({
          where: { ...whereFeedback, status: "OPEN" },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { student: { include: { user: { select: { fullName: true } } } } },
        });
        for (const f of feedbacks) {
          notifications.push({
            id: `feedback-${f.id}`,
            type: "feedback",
            title: "New Feedback",
            message: `${f.student.user.fullName} submitted feedback`,
            href: "/feedback",
            createdAt: f.createdAt.toISOString(),
            unread: isRecent(f.createdAt),
          });
        }
      } catch {
        // ignore
      }
    }

    // Sort by createdAt desc
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limited = notifications.slice(0, LIMIT);

    return successResponse({ notifications: limited }, "Notifications retrieved");
  } catch (error: unknown) {
    console.error("Notifications API error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return errorResponse("Database error", 503);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch notifications",
      500
    );
  }
}
