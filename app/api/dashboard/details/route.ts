import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const DETAIL_TYPES = [
  "students",
  "revenue",
  "pending_fees",
  "attendance",
  "franchises",
  "staff",
  "pending_certificates",
  "support",
  "course_enquiries",
  "franchise_inquiries",
  "offer_applications",
  "attendance_today",
] as const;

type DetailType = (typeof DETAIL_TYPES)[number];

function isDetailType(v: string): v is DetailType {
  return (DETAIL_TYPES as readonly string[]).includes(v);
}

function resolveFranchiseId(
  user: { roleId: number; franchiseId?: string | null },
  queryFranchiseId: string | null
): bigint | null {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return BigInt(user.franchiseId);
  }
  if (
    queryFranchiseId &&
    (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)
  ) {
    return BigInt(queryFranchiseId);
  }
  return null;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    if (
      user.roleId !== ROLES.SUPER_ADMIN &&
      user.roleId !== ROLES.ADMIN &&
      user.roleId !== ROLES.SUB_ADMIN
    ) {
      return forbiddenResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const typeParam = (searchParams.get("type") || "").trim();
    if (!isDetailType(typeParam)) {
      return errorResponse("Invalid detail type", 400);
    }

    const franchiseId = resolveFranchiseId(user, searchParams.get("franchiseId"));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const isAdmin =
      user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN;

    let columns: { key: string; label: string }[] = [];
    let items: Record<string, string | number | null>[] = [];
    let total = 0;
    let title = "Details";

    switch (typeParam) {
      case "students": {
        title = "Students";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "courseName", label: "Course" },
          { key: "franchiseName", label: "Franchise" },
          { key: "status", label: "Status" },
          { key: "admissionDate", label: "Admission" },
        ];
        const where = franchiseId ? { franchiseId } : {};
        const [rows, count] = await Promise.all([
          prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
              course: { select: { name: true } },
              franchise: { select: { name: true } },
            },
          }),
          prisma.student.count({ where }),
        ]);
        total = count;
        items = rows.map((s) => ({
          id: s.id.toString(),
          fullName: s.user.fullName,
          email: s.user.email,
          phone: s.user.phone,
          courseName: s.course?.name ?? "—",
          franchiseName: s.franchise.name,
          status: s.status,
          admissionDate: s.admissionDate.toISOString().split("T")[0],
        }));
        break;
      }

      case "pending_fees": {
        title = "Pending Fees — Students";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "courseName", label: "Course" },
          { key: "franchiseName", label: "Franchise" },
          { key: "totalFee", label: "Total Fee" },
          { key: "paidFee", label: "Paid" },
          { key: "pendingFee", label: "Pending" },
        ];
        const where = {
          ...(franchiseId ? { franchiseId } : {}),
        };
        const all = await prisma.student.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            course: { select: { name: true } },
            franchise: { select: { name: true } },
          },
        });
        const pending = all
          .map((s) => {
            const totalFee = Number(s.totalFee);
            const paidFee = Number(s.paidFee);
            const pendingFee = totalFee - paidFee;
            return {
              id: s.id.toString(),
              fullName: s.user.fullName,
              email: s.user.email,
              phone: s.user.phone,
              courseName: s.course?.name ?? "—",
              franchiseName: s.franchise.name,
              totalFee: `₹${totalFee.toLocaleString("en-IN")}`,
              paidFee: `₹${paidFee.toLocaleString("en-IN")}`,
              pendingFee: `₹${pendingFee.toLocaleString("en-IN")}`,
              _pending: pendingFee,
            };
          })
          .filter((s) => s._pending > 0);
        total = pending.length;
        items = pending.slice(skip, skip + limit).map(({ _pending, ...rest }) => rest);
        break;
      }

      case "revenue": {
        title = "Revenue Payments (Last 30 Days)";
        columns = [
          { key: "studentName", label: "Student" },
          { key: "email", label: "Email" },
          { key: "franchiseName", label: "Franchise" },
          { key: "amount", label: "Amount" },
          { key: "paymentMode", label: "Mode" },
          { key: "status", label: "Status" },
          { key: "date", label: "Date" },
        ];
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const where = {
          status: "SUCCESS" as const,
          paymentDate: { gte: since },
          ...(franchiseId ? { franchiseId } : {}),
        };
        const [rows, count] = await Promise.all([
          prisma.payment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { paymentDate: "desc" },
            include: {
              student: { include: { user: { select: { fullName: true, email: true } } } },
              franchise: { select: { name: true } },
            },
          }),
          prisma.payment.count({ where }),
        ]);
        total = count;
        items = rows.map((p) => ({
          id: p.id.toString(),
          studentName: p.student.user.fullName,
          email: p.student.user.email,
          franchiseName: p.franchise.name,
          amount: `₹${Number(p.amount).toLocaleString("en-IN")}`,
          paymentMode: p.paymentMode,
          status: p.status,
          date: (p.paymentDate || p.createdAt).toISOString().split("T")[0],
        }));
        break;
      }

      case "attendance":
      case "attendance_today": {
        title = typeParam === "attendance" ? "Today's Attendance %" : "Attendance Today";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "franchiseName", label: "Franchise" },
          { key: "status", label: "Status" },
          { key: "method", label: "Method" },
          { key: "date", label: "Date" },
        ];
        const today = startOfToday();
        const where = {
          attendanceDate: today,
          ...(franchiseId ? { franchiseId } : {}),
        };
        const [rows, count] = await Promise.all([
          prisma.attendance.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { fullName: true, email: true } },
              franchise: { select: { name: true } },
            },
          }),
          prisma.attendance.count({ where }),
        ]);
        total = count;
        items = rows.map((a) => ({
          id: a.id.toString(),
          fullName: a.user.fullName,
          email: a.user.email,
          franchiseName: a.franchise.name,
          status: a.status,
          method: a.method,
          date: a.attendanceDate.toISOString().split("T")[0],
        }));
        break;
      }

      case "franchises": {
        if (!isAdmin) return forbiddenResponse();
        title = "Franchises";
        columns = [
          { key: "name", label: "Name" },
          { key: "ownerName", label: "Owner" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "status", label: "Status" },
        ];
        const [rows, count] = await Promise.all([
          prisma.franchise.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { owner: { select: { fullName: true, email: true } } },
          }),
          prisma.franchise.count(),
        ]);
        total = count;
        items = rows.map((f) => ({
          id: f.id.toString(),
          name: f.name,
          ownerName: f.owner.fullName,
          email: f.email || f.owner.email,
          phone: f.phone,
          city: f.city,
          state: f.state,
          status: f.status,
        }));
        break;
      }

      case "staff": {
        title = "Staff";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "franchiseName", label: "Franchise" },
          { key: "salary", label: "Salary" },
          { key: "joiningDate", label: "Joining" },
          { key: "status", label: "Status" },
        ];
        const where = franchiseId ? { franchiseId } : {};
        const [rows, count] = await Promise.all([
          prisma.staff.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
              franchise: { select: { name: true } },
            },
          }),
          prisma.staff.count({ where }),
        ]);
        total = count;
        items = rows.map((s) => ({
          id: s.id.toString(),
          fullName: s.user.fullName,
          email: s.user.email,
          phone: s.user.phone,
          franchiseName: s.franchise.name,
          salary: `₹${Number(s.salary).toLocaleString("en-IN")}`,
          joiningDate: s.joiningDate.toISOString().split("T")[0],
          status: s.status,
        }));
        break;
      }

      case "pending_certificates": {
        title = "Pending Certificates";
        columns = [
          { key: "studentName", label: "Student" },
          { key: "studentEmail", label: "Email" },
          { key: "courseName", label: "Course" },
          { key: "franchiseName", label: "Franchise" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Requested" },
        ];
        const where = {
          status: "REQUESTED" as const,
          ...(franchiseId ? { franchiseId } : {}),
        };
        const [rows, count] = await Promise.all([
          prisma.certificate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              student: {
                include: {
                  user: { select: { fullName: true, email: true } },
                  course: { select: { name: true } },
                },
              },
              franchise: { select: { name: true } },
            },
          }),
          prisma.certificate.count({ where }),
        ]);
        total = count;
        items = rows.map((c) => ({
          id: c.id.toString(),
          studentName: c.student.user.fullName,
          studentEmail: c.student.user.email,
          courseName: c.student.course?.name ?? "—",
          franchiseName: c.franchise.name,
          status: c.status,
          createdAt: c.createdAt.toISOString().split("T")[0],
        }));
        break;
      }

      case "support": {
        if (!isAdmin) return forbiddenResponse();
        title = "Support Requests";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "source", label: "Source" },
          { key: "message", label: "Message" },
          { key: "createdAt", label: "Date" },
        ];
        const [rows, count] = await Promise.all([
          prisma.supportRequest.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          prisma.supportRequest.count(),
        ]);
        total = count;
        items = rows.map((r) => ({
          id: r.id.toString(),
          fullName: r.fullName,
          email: r.email,
          source: r.source,
          message: r.message.length > 120 ? `${r.message.slice(0, 120)}…` : r.message,
          createdAt: new Date(r.createdAt).toLocaleString("en-IN"),
        }));
        break;
      }

      case "course_enquiries": {
        if (!isAdmin) return forbiddenResponse();
        title = "Course Enquiries";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "courseName", label: "Course" },
          { key: "city", label: "City" },
          { key: "createdAt", label: "Date" },
        ];
        const [rows, count] = await Promise.all([
          prisma.courseEnrollmentRequest.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          prisma.courseEnrollmentRequest.count(),
        ]);
        total = count;
        items = rows.map((r) => ({
          id: r.id.toString(),
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          courseName: r.courseName,
          city: r.city,
          createdAt: r.createdAt.toISOString().split("T")[0],
        }));
        break;
      }

      case "franchise_inquiries": {
        if (!isAdmin) return forbiddenResponse();
        title = "Franchise Inquiries";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "investmentRange", label: "Investment" },
          { key: "createdAt", label: "Date" },
        ];
        const [rows, count] = await Promise.all([
          prisma.franchiseInquiry.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          prisma.franchiseInquiry.count(),
        ]);
        total = count;
        items = rows.map((r) => ({
          id: r.id.toString(),
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          city: r.city,
          state: r.state,
          investmentRange: r.investmentRange,
          createdAt: r.createdAt.toISOString().split("T")[0],
        }));
        break;
      }

      case "offer_applications": {
        if (!isAdmin) return forbiddenResponse();
        title = "Offer Applications";
        columns = [
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "offerTitle", label: "Offer" },
          { key: "message", label: "Message" },
          { key: "createdAt", label: "Date" },
        ];
        const model = (
          prisma as {
            offerApplication?: {
              findMany: (opts: object) => Promise<
                {
                  id: bigint;
                  fullName: string;
                  email: string;
                  phone: string;
                  offerTitle: string;
                  message: string | null;
                  createdAt: Date;
                }[]
              >;
              count: () => Promise<number>;
            };
          }
        ).offerApplication;
        if (!model) {
          return successResponse({
            title,
            columns,
            items: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        const [rows, count] = await Promise.all([
          model.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          model.count(),
        ]);
        total = count;
        items = rows.map((r) => ({
          id: r.id.toString(),
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          offerTitle: r.offerTitle,
          message: r.message
            ? r.message.length > 80
              ? `${r.message.slice(0, 80)}…`
              : r.message
            : "—",
          createdAt: r.createdAt.toISOString().split("T")[0],
        }));
        break;
      }
    }

    return successResponse({
      title,
      columns,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: unknown) {
    console.error("Dashboard details API error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch details",
      500
    );
  }
}
