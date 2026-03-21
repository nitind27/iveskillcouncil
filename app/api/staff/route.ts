import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

function getFranchiseFilter(user: { roleId: number; franchiseId?: string | null }) {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return { franchiseId: BigInt(user.franchiseId) };
  }
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { fullName, email, phone, password, franchiseId, salary, joiningDate } = body;

    if (!fullName || !email || !franchiseId || salary == null) {
      return errorResponse("Missing required fields: fullName, email, franchiseId, salary", 400);
    }

    const nameR = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = phone ? validatePhone(String(phone).trim()) : { valid: true };
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    const fid = BigInt(franchiseId);
    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== fid) {
      return errorResponse("Cannot add staff to another franchise", 403);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse("Email already registered", 400);

    const hashedPassword = await hashPassword(password || "Staff@123");
    const joining = joiningDate ? new Date(joiningDate) : new Date();

    const newUser = await prisma.user.create({
      data: {
        roleId: ROLES.STAFF,
        franchiseId: fid,
        fullName,
        email,
        phone: phone || null,
        password: hashedPassword,
      },
    });

    await prisma.staff.create({
      data: {
        userId: newUser.id,
        franchiseId: fid,
        salary: Number(salary),
        joiningDate: joining,
      },
    });

    return successResponse({ id: newUser.id.toString() }, "Staff added successfully");
  } catch (err) {
    console.error("Staff POST:", err);
    return errorResponse("Failed to add staff", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN && roleId !== ROLES.STAFF) {
      return errorResponse("Forbidden", 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get("limit") || "15", 10) || 15));
    const search = (searchParams.get("search") || "").trim();
    const franchiseId = searchParams.get("franchiseId");
    const status = searchParams.get("status");

    const filter = getFranchiseFilter(user);

    if (roleId === ROLES.STAFF) {
      const staff = await prisma.staff.findUnique({
        where: { userId: BigInt(user.id) },
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          franchise: { select: { name: true } },
        },
      });
      if (!staff) return successResponse({ item: null, isStaff: false });
      return successResponse({
        item: {
          id: staff.id.toString(),
          fullName: staff.user.fullName,
          email: staff.user.email,
          phone: staff.user.phone,
          franchiseName: staff.franchise.name,
          salary: Number(staff.salary),
          joiningDate: staff.joiningDate.toISOString().split("T")[0],
          status: staff.status,
        },
        isStaff: true,
      });
    }

    const baseWhere: Record<string, unknown> = { ...filter };
    if (franchiseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      baseWhere.franchiseId = BigInt(franchiseId);
    }
    if (status) baseWhere.status = status;
    if (search) {
      baseWhere.user = {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const [staffList, total] = await Promise.all([
      prisma.staff.findMany({
        where: baseWhere,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          franchise: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.staff.count({ where: baseWhere }),
    ]);

    const items = staffList.map((s) => ({
      id: s.id.toString(),
      fullName: s.user.fullName,
      email: s.user.email,
      phone: s.user.phone,
      franchiseName: s.franchise.name,
      salary: Number(s.salary),
      joiningDate: s.joiningDate.toISOString().split("T")[0],
      status: s.status,
    }));

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Staff retrieved"
    );
  } catch (err) {
    console.error("Staff GET:", err);
    return errorResponse("Failed to fetch staff", 500);
  }
}
