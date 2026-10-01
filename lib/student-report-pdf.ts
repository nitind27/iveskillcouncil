import fs from "fs";
import path from "path";
import type { StudentReport, StudentReportGroupRow } from "@/lib/student-report";

// Load pdfkit at runtime (not webpack-bundled) so font AFM files resolve correctly
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

export type StudentReportPdfMeta = {
  /** Label/value pairs describing the applied filters. */
  filters: [string, string][];
  generatedBy: string;
  showFranchiseColumn: boolean;
  includeStudents: boolean;
};

const C = {
  navy: "#0F2744",
  primary: "#1E4A85",
  gold: "#C4A35A",
  text: "#0F172A",
  muted: "#64748B",
  border: "#CBD5E1",
  soft: "#F1F5F9",
  zebra: "#F8FAFC",
  red: "#B91C1C",
  green: "#047857",
  totalBg: "#FEF3C7",
};

const ORG = "Institute of Vocational Education & Skill Development Council";

/** Standard PDF fonts have no rupee glyph, so amounts use "Rs." */
function money(n: number) {
  return `Rs. ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function num(n: number) {
  return Number(n || 0).toLocaleString("en-IN");
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

function nowLabel() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveLogoPath() {
  const candidates = ["IVESDC LOGO-01.png", "IVESDC LOGO-07.png", "IVESDC LOGO-05.png"].map((f) =>
    path.join(process.cwd(), "public", "logo", f)
  );
  return candidates.find((p) => fs.existsSync(p)) || null;
}

type Align = "left" | "right" | "center";
type Column = { header: string; width: number; align?: Align };

export async function buildStudentReportPdf(report: StudentReport, meta: StudentReportPdfMeta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 32,
      bufferPages: true,
      info: { Title: "IVESDC — Student Report", Author: meta.generatedBy, Creator: ORG },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const left = 32;
    const right = pageW - 32;
    const contentW = right - left;
    const bottomLimit = pageH - 44;
    let y = 0;

    const fit = (text: string, width: number) => {
      const s = String(text ?? "");
      if (doc.widthOfString(s) <= width) return s;
      let lo = 0;
      let hi = s.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (doc.widthOfString(`${s.slice(0, mid)}…`) <= width) lo = mid;
        else hi = mid - 1;
      }
      return `${s.slice(0, lo)}…`;
    };

    const cell = (text: string, x: number, cy: number, width: number, align: Align = "left") => {
      doc.text(fit(text, width - 10), x + 5, cy, { width: width - 10, align, lineBreak: false });
    };

    // —— Page 1 header ——
    doc.rect(0, 0, pageW, 78).fill(C.navy);
    doc.rect(0, 78, pageW, 3).fill(C.gold);
    const logo = resolveLogoPath();
    let textX = left;
    if (logo) {
      doc.roundedRect(left, 12, 54, 54, 8).fill("#FFFFFF");
      try {
        doc.image(logo, left + 4, 16, { fit: [46, 46], align: "center", valign: "center" });
      } catch {
        // logo is optional
      }
      textX = left + 68;
    }
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text("Student Report", textX, 16, { lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor("#C7D5E8").text(`IVESDC · ${ORG}`, textX, 40, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor(C.gold).text(`Generated ${nowLabel()}  ·  by ${meta.generatedBy}`, textX, 54, {
      lineBreak: false,
    });
    y = 96;

    // —— Applied filters ——
    const filterText = meta.filters.map(([k, v]) => `${k}: ${v}`);
    doc.font("Helvetica").fontSize(8);
    const chipH = 16;
    let chipX = left + 10;
    let chipY = y + 22;
    const chips: { x: number; y: number; w: number; text: string }[] = [];
    for (const t of filterText) {
      const w = Math.min(doc.widthOfString(t) + 14, contentW - 20);
      if (chipX + w > right - 10) {
        chipX = left + 10;
        chipY += chipH + 5;
      }
      chips.push({ x: chipX, y: chipY, w, text: t });
      chipX += w + 6;
    }
    const filterBoxH = chipY + chipH + 10 - y;
    doc.roundedRect(left, y, contentW, filterBoxH, 6).fillAndStroke(C.soft, C.border);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.primary).text("FILTERS APPLIED", left + 10, y + 8, { lineBreak: false });
    doc.font("Helvetica").fontSize(8);
    for (const ch of chips) {
      doc.roundedRect(ch.x, ch.y, ch.w, chipH, 8).fillAndStroke("#FFFFFF", C.border);
      doc.fillColor(C.text).text(fit(ch.text, ch.w - 14), ch.x + 7, ch.y + 4.5, { lineBreak: false });
    }
    y += filterBoxH + 12;

    // —— KPI tiles ——
    const s = report.summary;
    const kpis: { label: string; value: string; sub?: string; color: string }[] = [
      { label: "Total Students", value: num(s.students), sub: `${num(s.active)} active · ${num(s.completed)} completed · ${num(s.dropped)} dropped`, color: C.primary },
      { label: "Pending Fee Students", value: num(s.pendingStudents), sub: `${num(s.fullyPaid)} fully paid`, color: C.red },
      { label: "Total Fees", value: money(s.totalFee), color: C.primary },
      { label: "Fees Collected", value: money(s.paidFee), sub: `${s.collectionPercent}% collected`, color: C.green },
      { label: "Pending Amount", value: money(s.pendingFee), color: C.red },
    ];
    const gap = 8;
    const tileW = (contentW - gap * (kpis.length - 1)) / kpis.length;
    kpis.forEach((k, i) => {
      const x = left + i * (tileW + gap);
      doc.roundedRect(x, y, tileW, 52, 6).fillAndStroke("#FFFFFF", C.border);
      doc.rect(x, y + 8, 3, 36).fill(k.color);
      doc.font("Helvetica").fontSize(7.5).fillColor(C.muted).text(k.label.toUpperCase(), x + 11, y + 8, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(13).fillColor(k.color);
      doc.text(fit(k.value, tileW - 18), x + 11, y + 20, { lineBreak: false });
      if (k.sub) {
        doc.font("Helvetica").fontSize(6.5).fillColor(C.muted);
        doc.text(fit(k.sub, tileW - 18), x + 11, y + 38, { lineBreak: false });
      }
    });
    y += 66;

    // —— Table helpers ——
    const rowH = 16;
    const drawHeader = (cols: Column[]) => {
      doc.rect(left, y, contentW, 19).fill(C.primary);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF");
      let x = left;
      cols.forEach((c) => {
        cell(c.header, x, y + 6, c.width, c.align);
        x += c.width;
      });
      y += 19;
    };

    const newPage = () => {
      doc.addPage();
      y = 32;
    };

    const sectionTitle = (label: string, note?: string) => {
      if (y + 60 > bottomLimit) newPage();
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy).text(label, left, y, { lineBreak: false });
      if (note) {
        doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(note, left, y + 2, { width: contentW, align: "right", lineBreak: false });
      }
      y += 15;
      doc.moveTo(left, y).lineTo(right, y).strokeColor(C.gold).lineWidth(1.2).stroke();
      y += 6;
    };

    type RowStyle = { bold?: boolean; bg?: string; colors?: (string | undefined)[] };
    const drawTable = (cols: Column[], rows: string[][], styles: RowStyle[] = []) => {
      drawHeader(cols);
      rows.forEach((r, ri) => {
        if (y + rowH > bottomLimit) {
          newPage();
          drawHeader(cols);
        }
        const st = styles[ri] ?? {};
        const bg = st.bg ?? (ri % 2 === 1 ? C.zebra : undefined);
        if (bg) doc.rect(left, y, contentW, rowH).fill(bg);
        doc.moveTo(left, y + rowH).lineTo(right, y + rowH).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
        doc.font(st.bold ? "Helvetica-Bold" : "Helvetica").fontSize(7.5);
        let x = left;
        cols.forEach((c, ci) => {
          doc.fillColor(st.colors?.[ci] ?? C.text);
          cell(r[ci] ?? "", x, y + 5, c.width, c.align);
          x += c.width;
        });
        y += rowH;
      });
      y += 14;
    };

    const scale = (weights: number[]) => {
      const sum = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => (w / sum) * contentW);
    };

    const groupTable = (label: string, groups: StudentReportGroupRow[]) => {
      const w = scale([30, 220, 70, 100, 100, 100, 80]);
      const cols: Column[] = [
        { header: "#", width: w[0], align: "center" },
        { header: label, width: w[1] },
        { header: "Students", width: w[2], align: "right" },
        { header: "Total Fees", width: w[3], align: "right" },
        { header: "Collected", width: w[4], align: "right" },
        { header: "Pending", width: w[5], align: "right" },
        { header: "Pending Stu.", width: w[6], align: "right" },
      ];
      const rows = groups.map((g, i) => [
        String(i + 1),
        g.name,
        num(g.students),
        money(g.totalFee),
        money(g.paidFee),
        money(g.pendingFee),
        num(g.pendingStudents),
      ]);
      const styles: RowStyle[] = groups.map((g) => ({
        colors: [undefined, undefined, undefined, undefined, g.paidFee > 0 ? C.green : C.muted, g.pendingFee > 0 ? C.red : undefined],
      }));
      rows.push(["", "TOTAL", num(s.students), money(s.totalFee), money(s.paidFee), money(s.pendingFee), num(s.pendingStudents)]);
      styles.push({ bold: true, bg: C.totalBg });
      drawTable(cols, rows, styles);
    };

    sectionTitle("Course-wise Summary", `${report.courses.length} course${report.courses.length === 1 ? "" : "s"}`);
    groupTable("Course", report.courses);

    if (meta.showFranchiseColumn) {
      sectionTitle("Franchise-wise Summary", `${report.franchises.length} franchises`);
      groupTable("Franchise", report.franchises);
    }

    // —— Student list ——
    if (meta.includeStudents) {
      const list = report.rows;
      sectionTitle(
        "Student List",
        report.truncated ? `First ${num(list.length)} students (narrow the filters to see all)` : `${num(list.length)} students`
      );
      const weights = meta.showFranchiseColumn
        ? [26, 82, 130, 72, 130, 110, 60, 70, 70, 70, 54]
        : [26, 86, 150, 76, 170, 64, 76, 76, 76, 56];
      const w = scale(weights);
      const headers: [string, Align?][] = [
        ["#", "center"],
        ["Student ID"],
        ["Student Name"],
        ["Mobile"],
        ["Course"],
        ...(meta.showFranchiseColumn ? ([["Franchise"]] as [string][]) : []),
        ["Admission"],
        ["Total Fee", "right"],
        ["Paid", "right"],
        ["Pending", "right"],
        ["Status", "center"],
      ];
      const cols: Column[] = headers.map(([header, align], i) => ({ header, align, width: w[i] }));
      const pendingCol = cols.length - 2;
      const paidCol = cols.length - 3;

      const rows = list.map((r, i) => [
        String(i + 1),
        r.studentCode,
        r.fullName,
        r.phone || "—",
        r.courseName,
        ...(meta.showFranchiseColumn ? [r.franchiseName] : []),
        fmtDate(r.admissionDate),
        money(r.totalFee),
        money(r.paidFee),
        r.pendingFee > 0 ? money(r.pendingFee) : r.totalFee > 0 ? "Paid" : "—",
        titleCase(r.status),
      ]);
      const styles: RowStyle[] = list.map((r) => {
        const colors: (string | undefined)[] = [];
        colors[paidCol] = r.paidFee > 0 ? C.green : C.muted;
        colors[pendingCol] = r.pendingFee > 0 ? C.red : r.totalFee > 0 ? C.green : C.muted;
        return { colors };
      });
      const totalRow = Array(cols.length).fill("");
      totalRow[2] = `TOTAL (${num(list.length)} students)`;
      totalRow[cols.length - 4] = money(s.totalFee);
      totalRow[paidCol] = money(s.paidFee);
      totalRow[pendingCol] = money(s.pendingFee);
      rows.push(totalRow);
      styles.push({ bold: true, bg: C.totalBg });

      if (list.length === 0) {
        doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("No students match the selected filters.", left, y);
        y += 20;
      } else {
        drawTable(cols, rows, styles);
      }
    }

    // —— Footer on every page ——
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      const fy = pageH - 26;
      doc.moveTo(left, fy - 6).lineTo(right, fy - 6).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.font("Helvetica").fontSize(7).fillColor(C.muted);
      doc.text("IVESDC · Student Report · Confidential", left, fy, { lineBreak: false });
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, left, fy, { width: contentW, align: "right", lineBreak: false });
    }

    doc.end();
  });
}
