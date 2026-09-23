import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import {
  ensureCourseSubjectsFromLegacy,
  parseSubjectNames,
} from "@/lib/course-subjects";

export const dynamic = "force-dynamic";

function getFranchiseScope(user: { roleId: number; franchiseId?: string | null }) {
  if (Number(user.roleId) === ROLES.SUB_ADMIN && user.franchiseId) {
    return BigInt(user.franchiseId);
  }
  return null;
}

async function loadCourseSubjects(courseId: bigint) {
  await ensureCourseSubjectsFromLegacy(courseId);
  const rows = await prisma.courseSubject.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, maxMarks: true },
  });
  if (rows.length > 0) return rows;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { certificateSubject: true, objectiveMarks: true, practicalMarks: true },
  });
  const defaultMax = course?.objectiveMarks ?? course?.practicalMarks ?? 100;
  return parseSubjectNames(course?.certificateSubject).map((name) => ({
    name,
    maxMarks: defaultMax,
  }));
}

/** GET: students + subjects + marks for a course (class-wise marks entry) */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const sp = request.nextUrl.searchParams;
    const courseIdParam = sp.get("courseId");
    if (!courseIdParam) {
      return errorResponse("courseId is required", 400);
    }

    const courseId = BigInt(courseIdParam);
    const search = (sp.get("search") || "").trim();
    const franchiseFilterParam = sp.get("franchiseId");
    const scopedFranchiseId = getFranchiseScope(user);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        practicalMarks: true,
        objectiveMarks: true,
        status: true,
      },
    });
    if (!course) return errorResponse("Course not found", 404);

    const subjectRows = await loadCourseSubjects(courseId);
    const subjects = subjectRows.map((s) => s.name);
    const subjectMaxMap = new Map(subjectRows.map((s) => [s.name, s.maxMarks]));
    const defaultMax = course.objectiveMarks ?? course.practicalMarks ?? 100;

    if (subjects.length === 0) {
      return successResponse({
        course: {
          id: String(course.id),
          name: course.name,
          subjects: [],
          subjectMeta: [],
          defaultMaxMarks: defaultMax,
        },
        students: [],
        message:
          "No subjects on this course. Add them from Course Subjects (/dashboard/subjects).",
      });
    }

    const where: Record<string, unknown> = {
      courseId,
      status: { not: "DROPPED" },
    };

    if (scopedFranchiseId) {
      where.franchiseId = scopedFranchiseId;
    } else if (
      franchiseFilterParam &&
      (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)
    ) {
      where.franchiseId = BigInt(franchiseFilterParam);
    }

    if (search) {
      where.OR = [
        { studentCode: { contains: search } },
        {
          user: {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { user: { fullName: "asc" } },
      take: 500,
      select: {
        id: true,
        studentCode: true,
        status: true,
        franchiseId: true,
        user: { select: { fullName: true, email: true, phone: true } },
        franchise: { select: { id: true, name: true } },
      },
    });

    const studentIds = students.map((s) => s.id);
    const existingMarks =
      studentIds.length === 0
        ? []
        : await prisma.studentSubjectMark.findMany({
            where: {
              courseId,
              studentId: { in: studentIds },
            },
            select: {
              studentId: true,
              subjectName: true,
              maxMarks: true,
              obtainedMarks: true,
            },
          });

    const marksMap = new Map<string, { obtainedMarks: number; maxMarks: number }>();
    for (const m of existingMarks) {
      marksMap.set(`${m.studentId}|${m.subjectName}`, {
        obtainedMarks: m.obtainedMarks,
        maxMarks: m.maxMarks,
      });
    }

    return successResponse({
      course: {
        id: String(course.id),
        name: course.name,
        subjects,
        subjectMeta: subjectRows.map((s) => ({
          name: s.name,
          maxMarks: s.maxMarks,
        })),
        defaultMaxMarks: defaultMax,
      },
      students: students.map((s) => {
        const marks: Record<string, { obtainedMarks: number; maxMarks: number }> = {};
        for (const subject of subjects) {
          const subMax = subjectMaxMap.get(subject) ?? defaultMax;
          const hit = marksMap.get(`${s.id}|${subject}`);
          marks[subject] = hit ?? { obtainedMarks: 0, maxMarks: subMax };
        }
        return {
          id: String(s.id),
          studentCode: s.studentCode,
          fullName: s.user.fullName,
          email: s.user.email,
          phone: s.user.phone,
          status: s.status,
          franchiseId: s.franchiseId ? String(s.franchiseId) : null,
          franchiseName: s.franchise?.name ?? null,
          marks,
        };
      }),
    });
  } catch (e) {
    console.error("[GET /api/students/marks]", e);
    return errorResponse("Failed to load marks", 500);
  }
}

/** PUT: bulk upsert subject marks for students in a course */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const courseIdParam = body?.courseId;
    const entries = Array.isArray(body?.entries) ? body.entries : null;

    if (!courseIdParam || !entries) {
      return errorResponse("courseId and entries[] are required", 400);
    }
    if (entries.length === 0) {
      return errorResponse("No marks to save", 400);
    }
    if (entries.length > 5000) {
      return errorResponse("Too many entries (max 5000)", 400);
    }

    const courseId = BigInt(String(courseIdParam));
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, objectiveMarks: true, practicalMarks: true },
    });
    if (!course) return errorResponse("Course not found", 404);

    const subjectRows = await loadCourseSubjects(courseId);
    const allowedSubjects = new Set(subjectRows.map((s) => s.name));
    const subjectMaxMap = new Map(subjectRows.map((s) => [s.name, s.maxMarks]));
    if (allowedSubjects.size === 0) {
      return errorResponse("Course has no subjects configured. Add them from Course Subjects page.", 400);
    }

    const defaultMax = course.objectiveMarks ?? course.practicalMarks ?? 100;
    const scopedFranchiseId = getFranchiseScope(user);
    const updatedById = user.id ? BigInt(String(user.id)) : null;

    type Row = {
      studentId: bigint;
      subjectName: string;
      obtainedMarks: number;
      maxMarks: number;
    };
    const rows: Row[] = [];
    const studentIdSet = new Set<string>();

    for (const raw of entries) {
      const studentId = String(raw?.studentId || "").trim();
      const subjectName = String(raw?.subjectName || "").trim();
      if (!studentId || !subjectName) continue;
      if (!allowedSubjects.has(subjectName)) {
        return errorResponse(`Invalid subject: ${subjectName}`, 400);
      }

      const obtained = Number(raw?.obtainedMarks);
      const max =
        raw?.maxMarks != null
          ? Number(raw.maxMarks)
          : subjectMaxMap.get(subjectName) ?? defaultMax;
      if (!Number.isFinite(obtained) || obtained < 0) {
        return errorResponse(`Invalid obtained marks for ${subjectName}`, 400);
      }
      if (!Number.isFinite(max) || max <= 0) {
        return errorResponse(`Invalid max marks for ${subjectName}`, 400);
      }
      if (obtained > max) {
        return errorResponse(
          `Obtained marks (${obtained}) cannot exceed max (${max}) for ${subjectName}`,
          400
        );
      }

      studentIdSet.add(studentId);
      rows.push({
        studentId: BigInt(studentId),
        subjectName,
        obtainedMarks: Math.round(obtained),
        maxMarks: Math.round(max),
      });
    }

    if (rows.length === 0) {
      return errorResponse("No valid mark entries", 400);
    }

    const students = await prisma.student.findMany({
      where: {
        id: { in: [...studentIdSet].map((id) => BigInt(id)) },
        courseId,
        ...(scopedFranchiseId ? { franchiseId: scopedFranchiseId } : {}),
      },
      select: { id: true },
    });
    const allowedStudentIds = new Set(students.map((s) => String(s.id)));
    for (const sid of studentIdSet) {
      if (!allowedStudentIds.has(sid)) {
        return errorResponse("One or more students are not in this course / your franchise", 403);
      }
    }

    await prisma.$transaction(
      rows.map((r) =>
        prisma.studentSubjectMark.upsert({
          where: {
            studentId_courseId_subjectName: {
              studentId: r.studentId,
              courseId,
              subjectName: r.subjectName,
            },
          },
          create: {
            studentId: r.studentId,
            courseId,
            subjectName: r.subjectName,
            obtainedMarks: r.obtainedMarks,
            maxMarks: r.maxMarks,
            updatedById,
          },
          update: {
            obtainedMarks: r.obtainedMarks,
            maxMarks: r.maxMarks,
            updatedById,
          },
        })
      )
    );

    return successResponse({ saved: rows.length }, "Marks saved successfully");
  } catch (e) {
    console.error("[PUT /api/students/marks]", e);
    return errorResponse("Failed to save marks", 500);
  }
}
