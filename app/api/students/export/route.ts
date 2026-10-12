import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const NAVY = "FF1E4A85";
const GOLD = "FFC4A35A";
const HEADER_FILL = "FF1E4A85";
const ZEBRA = "FFF4F7FB";
const TOTAL_FILL = "FFFFF6E8";

type CourseBits = {
  id: bigint;
  name: string;
  category: string | null;
  durationMonths: number;
  durationValue: number | null;
  durationUnit: string | null;
  level: string;
  mode: string;
  certificateType: string | null;
};

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}

function durationLabel(course: CourseBits) {
  if (course.durationValue && course.durationUnit) {
    return `${course.durationValue} ${course.durationUnit}`;
  }
  if (course.durationMonths > 0) {
    return course.durationMonths === 1 ? "1 month" : `${course.durationMonths} months`;
  }
  return "";
}

function inr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD6DEEA" } },
      bottom: { style: "thin", color: { argb: "FFD6DEEA" } },
      left: { style: "thin", color: { argb: "FFD6DEEA" } },
      right: { style: "thin", color: { argb: "FFD6DEEA" } },
    };
  });
}

function styleDataCell(cell: ExcelJS.Cell, zebra: boolean) {
  cell.font = { size: 11, name: "Calibri", color: { argb: "FF0F172A" } };
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE6ECF4" } },
    bottom: { style: "thin", color: { argb: "FFE6ECF4" } },
    left: { style: "thin", color: { argb: "FFE6ECF4" } },
    right: { style: "thin", color: { argb: "FFE6ECF4" } },
  };
  if (zebra) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
  }
}

function paintTitle(sheet: ExcelJS.Worksheet, lastCol: string, title: string, subtitle: string) {
  sheet.mergeCells(`A1:${lastCol}1`);
  sheet.mergeCells(`A2:${lastCol}2`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: NAVY }, name: "Calibri" };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  sheet.getRow(1).height = 28;

  const sub = sheet.getCell("A2");
  sub.value = subtitle;
  sub.font = { size: 10, color: { argb: "FF475569" }, name: "Calibri" };
  sub.alignment = { vertical: "middle", wrapText: true };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF6E8" } };
  sheet.getRow(2).height = 20;

  sheet.getCell("A1").border = { bottom: { style: "medium", color: { argb: GOLD } } };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const params = request.nextUrl.searchParams;
    const scope = params.get("scope") === "all" ? "all" : "filtered";
    const search = scope === "all" ? "" : (params.get("search") || "").trim();
    const status = scope === "all" ? "" : (params.get("status") || "").trim();
    const franchiseId = scope === "all" ? "" : (params.get("franchiseId") || "").trim();
    const courseId = scope === "all" ? "" : (params.get("courseId") || "").trim();

    if (status && !["ACTIVE", "COMPLETED", "DROPPED"].includes(status)) {
      return errorResponse("Invalid status filter", 400);
    }

    const where: Record<string, unknown> = {};
    if (roleId === ROLES.SUB_ADMIN && user.franchiseId) {
      where.franchiseId = BigInt(user.franchiseId);
    } else if (franchiseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      where.franchiseId = BigInt(franchiseId);
    }
    if (status) where.status = status;

    const and: Record<string, unknown>[] = [];
    if (courseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN || roleId === ROLES.SUB_ADMIN)) {
      const cid = BigInt(courseId);
      and.push({
        OR: [
          { courseId: cid },
          { enrollments: { some: { courseId: cid, status: "ACTIVE" } } },
        ],
      });
    }
    if (search) {
      and.push({
        OR: [
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
        ],
      });
    }
    if (and.length) where.AND = and;

    const students = await prisma.student.findMany({
      where,
      orderBy: [{ franchise: { name: "asc" } }, { studentCode: "asc" }],
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        franchise: { select: { name: true } },
        course: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMonths: true,
            durationValue: true,
            durationUnit: true,
            level: true,
            mode: true,
            certificateType: true,
          },
        },
        enrollments: {
          orderBy: { createdAt: "asc" },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                category: true,
                durationMonths: true,
                durationValue: true,
                durationUnit: true,
                level: true,
                mode: true,
                certificateType: true,
              },
            },
          },
        },
      },
    });

    const [franchiseName, courseName] = await Promise.all([
      franchiseId
        ? prisma.franchise.findUnique({ where: { id: BigInt(franchiseId) }, select: { name: true } })
        : Promise.resolve(null),
      courseId
        ? prisma.course.findUnique({ where: { id: BigInt(courseId) }, select: { name: true } })
        : Promise.resolve(null),
    ]);

    const filterBits = scope === "all"
      ? ["All students"]
      : [
          search ? `Search: ${search}` : "",
          status ? `Status: ${titleCase(status)}` : "",
          franchiseName?.name ? `Franchise: ${franchiseName.name}` : "",
          courseName?.name ? `Course: ${courseName.name}` : "",
        ].filter(Boolean);
    const filterText = filterBits.length ? filterBits.join("   |   ") : "All students";
    const exportedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const subtitle = `Exported ${exportedAt}   |   ${filterText}   |   ${students.length} student${students.length === 1 ? "" : "s"}`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IVESDC";
    workbook.created = new Date();

    const studentHeaders = [
      "Sr. No.",
      "Student Code",
      "Full Name",
      "First Name",
      "Surname",
      "Gender",
      "Date of Birth",
      "Father / Husband Name",
      "Relationship",
      "Mother Name",
      "Email",
      "Mobile",
      "Alternate Mobile",
      "Franchise",
      "All Courses",
      "Primary Course",
      "Courses",
      "Total Fee",
      "Paid",
      "Pending",
      "Admission Date",
      "Status",
      "Address",
      "Area",
      "City",
      "State",
      "Pincode",
    ];

    const studentsSheet = workbook.addWorksheet("Students", {
      views: [{ state: "frozen", ySplit: 3, xSplit: 3 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
      headerFooter: { oddFooter: "&LIVESDC student register&RPage &P of &N" },
    });
    studentsSheet.columns = [
      { width: 8 }, { width: 18 }, { width: 26 }, { width: 16 }, { width: 16 },
      { width: 12 }, { width: 14 }, { width: 24 }, { width: 16 }, { width: 22 },
      { width: 28 }, { width: 16 }, { width: 16 }, { width: 28 }, { width: 48 },
      { width: 28 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 },
      { width: 16 }, { width: 14 }, { width: 36 }, { width: 18 }, { width: 16 },
      { width: 16 }, { width: 12 },
    ];
    paintTitle(studentsSheet, "AA", "Student Register", subtitle);
    const studentHeaderRow = studentsSheet.getRow(3);
    // A plain array starts at column A. A leading empty slot shifts every header one column right.
    studentHeaderRow.values = studentHeaders;
    styleHeader(studentHeaderRow);
    studentsSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: studentHeaders.length } };
    studentsSheet.pageSetup.printTitlesRow = "1:3";

    let feeTotal = 0;
    let paidTotal = 0;
    let pendingTotal = 0;

    students.forEach((student, index) => {
      const enrolled = student.enrollments.map((row) => ({
        course: row.course,
        fee: money(row.totalFee),
        status: row.status,
        primary: student.courseId?.toString() === row.courseId.toString(),
      }));
      if (enrolled.length === 0 && student.course) {
        enrolled.push({
          course: student.course,
          fee: money(student.totalFee),
          status: "ACTIVE",
          primary: true,
        });
      }
      const primary = enrolled.find((row) => row.primary) || enrolled[0];
      const courseText = enrolled.length
        ? enrolled
            .map((row) => {
              const bits = [row.course.name];
              const duration = durationLabel(row.course);
              if (duration) bits.push(duration);
              bits.push(inr(row.fee));
              if (row.primary) bits.push("Primary");
              if (row.status !== "ACTIVE") bits.push(titleCase(row.status));
              return bits.join(" — ");
            })
            .join("\n")
        : "Not assigned";

      const totalFee = money(student.totalFee);
      const paidFee = money(student.paidFee);
      const pendingFee = Math.round((totalFee - paidFee) * 100) / 100;
      feeTotal += totalFee;
      paidTotal += paidFee;
      pendingTotal += pendingFee;

      const row = studentsSheet.addRow([
        index + 1,
        student.studentCode,
        student.user.fullName,
        student.firstName || "",
        student.surname || "",
        titleCase(student.gender),
        formatDate(student.dateOfBirth),
        student.fatherHusbandName || "",
        titleCase(student.relationship),
        student.motherName || "",
        student.user.email || "",
        student.user.phone || "",
        student.alternateMobile || "",
        student.franchise.name,
        courseText,
        primary?.course.name || "",
        enrolled.length,
        totalFee,
        paidFee,
        pendingFee,
        formatDate(student.admissionDate),
        titleCase(student.status),
        student.address || "",
        student.area || "",
        student.city || "",
        student.state || "",
        student.pincode || "",
      ]);
      const zebra = index % 2 === 1;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        styleDataCell(cell, zebra);
        if (col === 1 || col === 17 || col === 22) cell.alignment = { vertical: "middle", horizontal: "center" };
        if (col >= 18 && col <= 20) {
          cell.numFmt = '"₹"#,##0.00';
          cell.alignment = { vertical: "middle", horizontal: "right" };
        }
        if (col === 20 && pendingFee > 0) {
          cell.font = { size: 11, name: "Calibri", bold: true, color: { argb: "FFB45309" } };
        }
        if (col === 22) {
          const color = student.status === "ACTIVE" ? "FF047857" : student.status === "DROPPED" ? "FFB91C1C" : "FF1E4A85";
          cell.font = { size: 11, name: "Calibri", bold: true, color: { argb: color } };
        }
      });
      row.height = Math.max(20, enrolled.length * 18);
    });

    if (students.length > 0) {
      const firstData = 4;
      const lastData = 3 + students.length;
      const totalRow = studentsSheet.addRow([
        "",
        "",
        "Total",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        { formula: `SUBTOTAL(109,Q${firstData}:Q${lastData})`, result: students.length },
        { formula: `SUBTOTAL(109,R${firstData}:R${lastData})`, result: feeTotal },
        { formula: `SUBTOTAL(109,S${firstData}:S${lastData})`, result: paidTotal },
        { formula: `SUBTOTAL(109,T${firstData}:T${lastData})`, result: pendingTotal },
      ]);
      totalRow.height = 22;
      totalRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { bold: true, size: 11, name: "Calibri", color: { argb: NAVY } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_FILL } };
        cell.border = {
          top: { style: "medium", color: { argb: GOLD } },
          bottom: { style: "thin", color: { argb: "FFE6ECF4" } },
        };
        if (col >= 17 && col <= 20) {
          cell.numFmt = col === 17 ? "0" : '"₹"#,##0.00';
          cell.alignment = { vertical: "middle", horizontal: "right" };
        }
      });
    }

    const courseHeaders = [
      "Sr. No.",
      "Student Code",
      "Student Name",
      "Mobile",
      "Email",
      "Franchise",
      "Course",
      "Category",
      "Level",
      "Mode",
      "Duration",
      "Certificate",
      "Course Fee",
      "Primary",
      "Enrollment Status",
      "Student Status",
      "Admission Date",
    ];

    const courseSheet = workbook.addWorksheet("Courses", {
      views: [{ state: "frozen", ySplit: 3, xSplit: 2 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    courseSheet.columns = [
      { width: 8 }, { width: 18 }, { width: 26 }, { width: 16 }, { width: 28 },
      { width: 28 }, { width: 32 }, { width: 18 }, { width: 14 }, { width: 14 },
      { width: 16 }, { width: 16 }, { width: 14 }, { width: 12 }, { width: 18 },
      { width: 16 }, { width: 16 },
    ];
    paintTitle(courseSheet, "Q", "Student Courses", subtitle);
    const courseHeaderRow = courseSheet.getRow(3);
    courseHeaderRow.values = courseHeaders;
    styleHeader(courseHeaderRow);
    courseSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: courseHeaders.length } };

    let courseIndex = 0;
    let courseFeeTotal = 0;
    for (const student of students) {
      const rows = student.enrollments.map((row) => ({
        course: row.course,
        fee: money(row.totalFee),
        status: row.status,
        primary: student.courseId?.toString() === row.courseId.toString(),
      }));
      if (rows.length === 0 && student.course) {
        rows.push({ course: student.course, fee: money(student.totalFee), status: "ACTIVE", primary: true });
      }
      if (rows.length === 0) {
        rows.push({
          course: {
            id: BigInt(0),
            name: "Not assigned",
            category: null,
            durationMonths: 0,
            durationValue: null,
            durationUnit: null,
            level: "",
            mode: "",
            certificateType: null,
          },
          fee: 0,
          status: "",
          primary: false,
        });
      }
      for (const row of rows) {
        courseIndex += 1;
        courseFeeTotal += row.fee;
        const added = courseSheet.addRow([
          courseIndex,
          student.studentCode,
          student.user.fullName,
          student.user.phone || "",
          student.user.email || "",
          student.franchise.name,
          row.course.name,
          row.course.category || "",
          titleCase(row.course.level),
          titleCase(row.course.mode),
          durationLabel(row.course),
          titleCase(row.course.certificateType),
          row.fee,
          row.primary ? "Yes" : "No",
          titleCase(row.status) || "—",
          titleCase(student.status),
          formatDate(student.admissionDate),
        ]);
        const zebra = courseIndex % 2 === 0;
        added.eachCell({ includeEmpty: true }, (cell, col) => {
          styleDataCell(cell, zebra);
          if (col === 1 || col === 14) cell.alignment = { vertical: "middle", horizontal: "center" };
          if (col === 13) {
            cell.numFmt = '"₹"#,##0.00';
            cell.alignment = { vertical: "middle", horizontal: "right" };
          }
        });
        added.height = 20;
      }
    }

    if (courseIndex > 0) {
      const firstData = 4;
      const lastData = 3 + courseIndex;
      const totalRow = courseSheet.addRow([
        "",
        "",
        "Total",
        "",
        "",
        "",
        { formula: `SUBTOTAL(103,G${firstData}:G${lastData})`, result: courseIndex },
        "",
        "",
        "",
        "",
        "",
        { formula: `SUBTOTAL(109,M${firstData}:M${lastData})`, result: courseFeeTotal },
      ]);
      totalRow.height = 22;
      totalRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.font = { bold: true, size: 11, name: "Calibri", color: { argb: NAVY } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_FILL } };
        cell.border = { top: { style: "medium", color: { argb: GOLD } } };
        if (col === 13) {
          cell.numFmt = '"₹"#,##0.00';
          cell.alignment = { vertical: "middle", horizontal: "right" };
        }
      });
    }

    const raw = await workbook.xlsx.writeBuffer();
    const bytes = Buffer.from(raw);
    const day = new Date().toISOString().slice(0, 10);
    const filename = `students-${scope}-${day}.xlsx`;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("Students export:", err);
    const msg = err instanceof Error ? err.message : "Failed to export students";
    return errorResponse(msg || "Failed to export students", 500);
  }
}
