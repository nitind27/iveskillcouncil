"use client";

import React, { useEffect, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import type { CertificateDemoData, MarksheetSubject } from "./types";
import { CERT_IMAGE, CERT_STATIC } from "../certificate-layout";
import IvesdcCertificateTemplate from "../IvesdcCertificateTemplate";
import OfficialIvesdcCertTemplate from "../OfficialIvesdcCertTemplate";
import OfficialIvesdcMarksheetTemplate from "../OfficialIvesdcMarksheetTemplate";
import OfficialIvesdcMarksheetTemplateV2 from "../OfficialIvesdcMarksheetTemplateV2";
import type { CertificateDisplayData } from "@/lib/certificate-display";

export { OfficialIvesdcCertTemplate, OfficialIvesdcMarksheetTemplate, OfficialIvesdcMarksheetTemplateV2 };

const sans: CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif" };
const serif: CSSProperties = { fontFamily: "Georgia, 'Times New Roman', Times, serif" };

function buildQr(text: string, size = 120): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#0F2A4A", light: "#FFFFFF" },
  });
}

/** Standard Vocational Certificate using the official IVESDC layout */
export function VocationalCertTemplate({ data }: { data: CertificateDemoData }) {
  return <OfficialIvesdcCertTemplate data={data} printId="demo-cert-vocational" />;
}

/** Advance Diploma Certificate (Gold & Navy Ornate Layout) */
export function DiplomaCertTemplate({ data }: { data: CertificateDemoData }) {
  const W = 723;
  const H = 1024;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    buildQr(
      `IVESDC ADVANCE DIPLOMA VERIFICATION\nDiploma No: ${data.certificateNumber}\nStudent: ${data.studentName}\nRoll No: ${data.rollNumber || "N/A"}\nCourse: ${data.courseName}\nGrade: ${data.grade} (${data.marksPercent}%)\nIssue Date: ${data.issueDate}\nATC: ${data.atcName}\nVerify: verify.iveskillcouncil@gmail.com`,
      120
    ).then(setQrUrl).catch(() => setQrUrl(null));
  }, [data]);

  return (
    <div
      id="demo-cert-diploma"
      className="certificate-sheet relative mx-auto overflow-hidden bg-[#FFFDF9] shadow-2xl"
      style={{ width: W, height: H }}
    >
      {/* Ornate Diploma Gold & Navy Border */}
      <div className="absolute inset-3 border-[6px] border-[#1E4A85]" />
      <div className="absolute inset-5 border-[2px] border-[#C4A35A]" />
      <div className="absolute inset-[26px] border border-[#1E4A85]/40" />

      {/* Corner Ornaments */}
      <div className="absolute top-6 left-6 h-10 w-10 border-t-2 border-l-2 border-[#C4A35A]" />
      <div className="absolute top-6 right-6 h-10 w-10 border-t-2 border-r-2 border-[#C4A35A]" />
      <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-[#C4A35A]" />
      <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-[#C4A35A]" />

      {/* Main Content Area */}
      <div className="absolute inset-[36px] flex flex-col justify-between p-4" style={serif}>
        {/* Header */}
        <div className="text-center">
          {/* Logo */}
          <img
            src={CERT_IMAGE.logoSrc}
            alt="IVESDC"
            className="mx-auto h-[46px] w-auto object-contain"
          />
          <h1
            className="mt-1 text-[13px] font-black uppercase tracking-[0.04em] text-[#1E4A85]"
            style={sans}
          >
            {CERT_STATIC.orgName}
          </h1>
          <p className="mt-0.5 text-[7px] text-[#334155]" style={sans}>
            An Autonomous Body Registered under Section 8 of the Companies Act, 2013, MCA, Govt. of India
          </p>
          <p className="text-[7px] font-semibold text-[#8B6914]" style={sans}>
            ISO 9001:2015 & ISO 21001:2018 Certified Council · Skill India Mission Partner
          </p>
        </div>

        {/* Certificate Title Badge */}
        <div className="my-2 text-center">
          <div className="inline-block border-b-2 border-[#C4A35A] pb-1">
            <span
              className="text-[26px] font-extrabold uppercase tracking-[0.16em] text-[#0F2A4A]"
              style={{ ...serif, textShadow: "0 1px 1px rgba(0,0,0,0.08)" }}
            >
              Advance Diploma
            </span>
          </div>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8B6914]" style={sans}>
            National Vocational Education & Training Award
          </p>
        </div>

        {/* Meta Info Bar */}
        <div className="flex items-center justify-between border-y border-[#C4A35A]/40 py-1 text-[9px] font-bold text-[#1E4A85]" style={sans}>
          <span>Diploma No: <span className="font-mono text-[#0F2A4A]">{data.certificateNumber}</span></span>
          <span>Enrollment: <span className="font-mono text-[#0F2A4A]">{data.registrationNumber}</span></span>
          <span>Roll No: <span className="font-mono text-[#0F2A4A]">{data.rollNumber || "ADCA-42"}</span></span>
          <span>Sr. No: <span className="font-mono text-[#0F2A4A]">{data.serialNumber}</span></span>
        </div>

        {/* Body Recital */}
        <div className="my-2 space-y-3 text-center text-[#1A2634]">
          <p className="text-[12px] italic text-[#475569]">This is to certify that</p>
          <p className="text-[20px] font-extrabold uppercase tracking-wide text-[#0F2A4A] underline decoration-[#C4A35A] decoration-2 underline-offset-4" style={serif}>
            {data.studentName}
          </p>
          <p className="text-[10.5px] font-medium" style={sans}>
            Son / Daughter of <strong className="font-bold text-[#0F2A4A]">{data.parentName}</strong>
          </p>

          <p className="text-[10.5px] leading-relaxed text-[#334155]" style={sans}>
            having successfully fulfilled all the curriculum requirements and cleared the comprehensive evaluations prescribed by the council, is hereby conferred the award of
          </p>

          <div className="rounded-lg border border-[#C4A35A]/50 bg-gradient-to-r from-amber-50/50 via-[#FFF9EE] to-amber-50/50 py-2.5 px-4 shadow-sm">
            <p className="text-[14px] font-black uppercase tracking-wide text-[#1E4A85]" style={sans}>
              {data.courseName}
            </p>
            <p className="mt-1 text-[9px] font-semibold text-[#8B6914]" style={sans}>
              Duration: {data.duration || "1 Year / 2 Semesters (720 Hours)"} · Completed with {data.division || "First Class with Distinction"}
            </p>
          </div>

          <div className="mx-auto flex max-w-lg items-center justify-center gap-6 text-[10px] text-[#334155]" style={sans}>
            <span>Grade Obtained: <strong className="font-bold text-[#1E4A85]">{data.grade} ({data.marksPercent}%)</strong></span>
            <span>·</span>
            <span>Training Period: <strong>{data.trainingStart}</strong> to <strong>{data.trainingEnd}</strong></span>
          </div>

          <p className="text-[9.5px] text-[#475569]" style={sans}>
            Conducted at Authorised Training Centre: <strong className="text-[#0F2A4A]">{data.atcName}</strong> (ATC Code: <strong className="font-mono">{data.atcCode}</strong>), {data.trainingCentre}.
          </p>
        </div>

        {/* Lower Row: QR Code + Seal + Signatures */}
        <div className="mt-3 flex items-end justify-between border-t border-[#C4A35A]/40 pt-3">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="flex h-[76px] w-[76px] items-center justify-center border border-[#1E4A85]/50 bg-white p-1 shadow-sm">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[7px]">QR Code</span>
              )}
            </div>
            <span className="mt-1 text-[7px] font-semibold text-[#64748B]" style={sans}>
              Scan to Verify
            </span>
          </div>

          {/* Golden Seal Emblem */}
          <div className="flex flex-col items-center">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#C4A35A] bg-gradient-to-br from-[#FFF3D6] via-[#FCE3A1] to-[#D4A942] p-1 shadow-md">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-dashed border-[#8B6914] text-center">
                <span className="text-[7px] font-black uppercase text-[#422C08]" style={sans}>IVESDC</span>
                <span className="text-[6px] font-bold text-[#6D490E]" style={sans}>SEAL OF</span>
                <span className="text-[6px] font-black text-[#422C08]" style={sans}>EXCELLENCE</span>
              </div>
            </div>
            <span className="mt-1 text-[7.5px] font-bold text-[#8B6914]" style={sans}>
              Date: {data.issueDate}
            </span>
          </div>

          {/* Dual Signatures */}
          <div className="flex gap-6 text-center" style={sans}>
            <div>
              <div className="h-8 border-b border-[#1E4A85] flex items-end justify-center pb-0.5">
                <span className="text-[10px] font-serif italic text-blue-900">Dr. R. Sandanshiv</span>
              </div>
              <p className="mt-1 text-[8px] font-bold uppercase text-[#1E4A85]">Exam Controller</p>
              <p className="text-[6.5px] text-slate-500">National Council</p>
            </div>
            <div>
              <div className="h-8 border-b border-[#1E4A85] flex items-end justify-center pb-0.5">
                <span className="text-[10px] font-serif italic text-blue-900">Y. Prajapati</span>
              </div>
              <p className="mt-1 text-[8px] font-bold uppercase text-[#1E4A85]">Head of Institute</p>
              <p className="text-[6.5px] text-slate-500">Director / Chairman</p>
            </div>
          </div>
        </div>

        {/* Footer Address */}
        <div className="mt-2 text-center text-[6.5px] text-[#64748B]" style={sans}>
          <p>{CERT_STATIC.contact} · {CERT_STATIC.registeredOffice}</p>
        </div>
      </div>
    </div>
  );
}

/** Official Marksheet & Transcript Template (matching res.jpeg & cert.jpeg authentic border) */
export function MarksheetTemplate({ data }: { data: CertificateDemoData }) {
  return <OfficialIvesdcMarksheetTemplate data={data} printId="demo-cert-marksheet" />;
}

/** Statement of Marks (Result) — Layout 2 (silver lace blank-form style) */
export function MarksheetTemplateV2({ data }: { data: CertificateDemoData }) {
  return <OfficialIvesdcMarksheetTemplateV2 data={data} printId="demo-cert-marksheet2" />;
}

function LegacyMarksheetTemplate({ data }: { data: CertificateDemoData }) {
  const W = 723;
  const H = 1024;
  const subjects: MarksheetSubject[] = data.subjects && data.subjects.length > 0 ? data.subjects : [
    { code: "SUB-101", name: "Computer Fundamentals & Operating Systems", maxTheory: 70, marksTheory: 62, maxPractical: 30, marksPractical: 26, totalMax: 100, totalObtained: 88, grade: "A+" },
    { code: "SUB-102", name: "Programming in Python & Modern Data Structures", maxTheory: 70, marksTheory: 58, maxPractical: 30, marksPractical: 28, totalMax: 100, totalObtained: 86, grade: "A+" },
    { code: "SUB-103", name: "Relational Database Management (PostgreSQL / MySQL)", maxTheory: 70, marksTheory: 65, maxPractical: 30, marksPractical: 27, totalMax: 100, totalObtained: 92, grade: "A+" },
    { code: "SUB-104", name: "Web Development Technologies & API Architecture", maxTheory: 70, marksTheory: 61, maxPractical: 30, marksPractical: 29, totalMax: 100, totalObtained: 90, grade: "A+" },
    { code: "SUB-105", name: "Project Work, Live Viva & Practical Assessment", maxTheory: 40, marksTheory: 35, maxPractical: 60, marksPractical: 54, totalMax: 100, totalObtained: 89, grade: "A+" },
  ];

  const totalMax = subjects.reduce((sum, s) => sum + s.totalMax, 0);
  const totalObtained = subjects.reduce((sum, s) => sum + s.totalObtained, 0);
  const percent = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0.0";

  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    buildQr(
      `IVESDC MARKSHEET VERIFICATION\nRoll No: ${data.rollNumber || "RL-042"}\nEnrollment: ${data.registrationNumber}\nName: ${data.studentName}\nTotal Marks: ${totalObtained}/${totalMax} (${percent}%)\nResult: PASSED (Grade ${data.grade})\nDate: ${data.issueDate}`,
      110
    ).then(setQrUrl).catch(() => setQrUrl(null));
  }, [data, totalMax, totalObtained, percent]);

  return (
    <div
      id="demo-cert-marksheet"
      className="certificate-sheet relative mx-auto overflow-hidden bg-white shadow-2xl"
      style={{ width: W, height: H }}
    >
      {/* Crisp Dual Institutional Border */}
      <div className="absolute inset-2.5 border-[3px] border-[#1E4A85]" />
      <div className="absolute inset-4 border border-[#C4A35A]" />

      <div className="absolute inset-[24px] flex flex-col justify-between p-4" style={sans}>
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-[#1E4A85] pb-2">
            <img src={CERT_IMAGE.logoSrc} alt="IVESDC" className="h-[44px] w-auto object-contain" />
            <div className="flex-1 text-center px-2">
              <h1 className="text-[12px] font-black uppercase tracking-[0.02em] text-[#1E4A85]">
                {CERT_STATIC.orgName}
              </h1>
              <p className="text-[7px] text-slate-600">
                Registered under Section 8, Companies Act, 2013, MCA, Government of India
              </p>
              <p className="text-[7px] font-bold text-[#8B6914]">
                ISO 9001:2015 Certified · National Vocational Training Council
              </p>
            </div>
            {/* Student Photo Box Placeholder */}
            <div className="flex h-[54px] w-[46px] items-center justify-center rounded border border-[#1E4A85]/50 bg-slate-50 text-[7px] text-slate-400">
              Photo
            </div>
          </div>

          {/* Document Title Strip */}
          <div className="my-2 bg-[#1E4A85] py-1 text-center text-white">
            <h2 className="text-[13px] font-black uppercase tracking-[0.14em]">
              Statement of Marks & Cumulative Grade Report
            </h2>
          </div>

          {/* Student Particulars Table */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded border border-slate-300 bg-slate-50/70 p-2 text-[8.5px]">
            <div>
              <span className="font-bold text-slate-500">Student Name:</span>{" "}
              <strong className="font-bold text-[#0F2A4A]">{data.studentName}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-500">Father / Guardian:</span>{" "}
              <strong className="text-slate-800">{data.parentName}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-500">Enrollment / Reg No.:</span>{" "}
              <strong className="font-mono text-[#1E4A85]">{data.registrationNumber}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-500">Roll No.:</span>{" "}
              <strong className="font-mono text-[#0F2A4A]">{data.rollNumber || "RL-2025-993"}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-500">Course / Programme:</span>{" "}
              <strong className="text-[#1E4A85]">{data.courseName}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-500">Academic Session:</span>{" "}
              <strong>{data.session || "2025 – 2026"}</strong>
            </div>
            <div className="col-span-2 truncate">
              <span className="font-bold text-slate-500">ATC Center:</span>{" "}
              <span>{data.atcName} ({data.atcCode}), {data.trainingCentre}</span>
            </div>
          </div>
        </div>

        {/* Subjects & Marks Table */}
        <div className="my-2 flex-1">
          <table className="w-full border-collapse border border-[#1E4A85] text-left text-[8.5px]">
            <thead>
              <tr className="bg-[#1E4A85] text-white">
                <th className="border border-[#1E4A85] p-1.5 text-center font-bold" style={{ width: "10%" }}>Code</th>
                <th className="border border-[#1E4A85] p-1.5 font-bold" style={{ width: "42%" }}>Subject / Paper Title</th>
                <th className="border border-[#1E4A85] p-1.5 text-center font-bold" style={{ width: "12%" }}>Theory</th>
                <th className="border border-[#1E4A85] p-1.5 text-center font-bold" style={{ width: "12%" }}>Practical</th>
                <th className="border border-[#1E4A85] p-1.5 text-center font-bold" style={{ width: "12%" }}>Total</th>
                <th className="border border-[#1E4A85] p-1.5 text-center font-bold" style={{ width: "12%" }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, i) => (
                <tr key={sub.code} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-[#1E4A85]">{sub.code}</td>
                  <td className="border border-slate-300 p-1.5 font-medium text-slate-800">{sub.name}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">{sub.marksTheory} / {sub.maxTheory}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">{sub.marksPractical} / {sub.maxPractical}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-900">{sub.totalObtained} / {sub.totalMax}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold text-[#1E4A85]">{sub.grade}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#1E4A85] bg-amber-50/60 font-bold">
                <td colSpan={2} className="border border-slate-300 p-2 text-right uppercase text-[#0F2A4A]">
                  Grand Total & Final Performance:
                </td>
                <td colSpan={2} className="border border-slate-300 p-2 text-center text-[#1E4A85]">
                  {totalObtained} / {totalMax} Marks ({percent}%)
                </td>
                <td className="border border-slate-300 p-2 text-center text-emerald-800">
                  PASSED
                </td>
                <td className="border border-slate-300 p-2 text-center text-[10px] font-black text-[#8B6914]">
                  {data.grade}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Performance Summary Pill */}
          <div className="mt-2 flex items-center justify-between rounded border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-[8.5px] text-emerald-900">
            <span>Result: <strong className="font-extrabold">PASS (FIRST CLASS WITH DISTINCTION)</strong></span>
            <span>Total Percentage: <strong className="font-mono text-[10px] font-extrabold">{percent}%</strong></span>
            <span>Overall Evaluation: <strong className="font-bold">{data.gradeLabel}</strong></span>
          </div>

          {/* Grading Scale Guide */}
          <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-1.5 text-[7px] text-slate-600">
            <span className="font-bold text-slate-800">Grade System:</span> A+ : Outstanding (85% & Above) | A : Very Good (70% to 84%) | B : Good (55% to 69%) | C : Average (40% to 54%) | F : Re-appear / Below 40%
          </div>
        </div>

        {/* Verification & Signatures */}
        <div className="border-t border-[#1E4A85] pt-2">
          <div className="flex items-end justify-between">
            {/* QR Code */}
            <div className="flex items-center gap-2">
              <div className="h-16 w-16 border border-slate-300 bg-white p-0.5">
                {qrUrl && <img src={qrUrl} alt="QR" className="h-full w-full object-contain" />}
              </div>
              <div className="text-[7px] text-slate-600">
                <p className="font-bold text-[#1E4A85]">Certified Official Record</p>
                <p>Date of Issue: <strong>{data.issueDate}</strong></p>
                <p>Certificate Sr: <strong className="font-mono">{data.serialNumber}</strong></p>
              </div>
            </div>

            {/* Official Stamps & Dual Signatures */}
            <div className="flex items-end gap-8 text-center text-[8px]">
              <div>
                <div className="h-7 border-b border-slate-400 flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-slate-700">Exam Branch</span>
                </div>
                <p className="mt-0.5 font-bold uppercase text-slate-700">Checked By</p>
              </div>
              <div>
                <div className="h-7 border-b border-slate-400 flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Dr. R. Sandanshiv</span>
                </div>
                <p className="mt-0.5 font-bold uppercase text-[#1E4A85]">Controller of Examination</p>
              </div>
              <div>
                <div className="h-7 border-b border-slate-400 flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Y. Prajapati</span>
                </div>
                <p className="mt-0.5 font-bold uppercase text-[#1E4A85]">Head of Institute</p>
              </div>
            </div>
          </div>

          <p className="mt-1 text-center text-[6.5px] text-slate-400">
            Any alteration or erasure renders this statement of marks invalid · www.iveskillcouncil.edu.in
          </p>
        </div>
      </div>
    </div>
  );
}

/** ATC Center Franchise Affiliation Certificate */
export function AtcAffiliationTemplate({ data }: { data: CertificateDemoData }) {
  const W = 723;
  const H = 1024;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    buildQr(
      `IVESDC ATC AFFILIATION ACCREDITATION\nATC Code: ${data.atcCode}\nCenter: ${data.atcName}\nLocation: ${data.trainingCentre}\nValidity: ${data.trainingStart} to ${data.trainingEnd}\nStatus: Officially Accredited Training Centre\nVerify: iveskillcouncil@gmail.com`,
      120
    ).then(setQrUrl).catch(() => setQrUrl(null));
  }, [data]);

  return (
    <div
      id="demo-cert-affiliation"
      className="certificate-sheet relative mx-auto overflow-hidden bg-[#FAFCFF] shadow-2xl"
      style={{ width: W, height: H }}
    >
      {/* Royal Indigo and Gold Architectural Border */}
      <div className="absolute inset-3 border-[6px] border-[#163A6B]" />
      <div className="absolute inset-5 border-[2px] border-[#C4A35A]" />
      <div className="absolute inset-[24px] border border-[#163A6B]/30" />

      <div className="absolute inset-[34px] flex flex-col justify-between p-4" style={serif}>
        {/* Header */}
        <div className="text-center">
          <img src={CERT_IMAGE.logoSrc} alt="IVESDC" className="mx-auto h-[48px] w-auto object-contain" />
          <h1 className="mt-1 text-[13px] font-black uppercase tracking-[0.03em] text-[#163A6B]" style={sans}>
            {CERT_STATIC.orgName}
          </h1>
          <p className="text-[7.5px] text-slate-600" style={sans}>
            Registered under Ministry of Corporate Affairs (MCA), Government of India
          </p>
          <p className="text-[7.5px] font-bold text-[#8B6914]" style={sans}>
            ISO 9001:2015 & ISO 21001:2018 Certified National Vocational Body
          </p>
        </div>

        {/* Title */}
        <div className="my-3 text-center">
          <span className="text-[24px] font-black uppercase tracking-[0.14em] text-[#163A6B]">
            Certificate of Affiliation
          </span>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B6914]" style={sans}>
            Authorised Training Centre (ATC) Accreditation
          </p>
        </div>

        {/* ATC Badge Strip */}
        <div className="flex items-center justify-between border-y border-[#C4A35A]/50 bg-amber-50/40 py-1.5 px-3 text-[9px] font-bold text-[#163A6B]" style={sans}>
          <span>Affiliation No: <strong className="font-mono text-[#0F2A4A]">{data.certificateNumber}</strong></span>
          <span>ATC Code: <strong className="font-mono text-[#8B6914]">{data.atcCode}</strong></span>
          <span>Accreditation: <strong className="text-emerald-800">{data.accreditationLevel || "Grade 'A' National Centre"}</strong></span>
        </div>

        {/* Body Content */}
        <div className="my-3 space-y-3.5 text-center text-[#1E293B]">
          <p className="text-[11px] italic text-slate-500">This is to certify that the institution</p>
          <p className="text-[20px] font-black uppercase text-[#163A6B] underline decoration-[#C4A35A] decoration-2 underline-offset-4">
            {data.atcName}
          </p>
          <p className="text-[10.5px] font-semibold text-slate-700" style={sans}>
            Located at: {data.franchiseAddress}
          </p>
          {data.centerHead && (
            <p className="text-[10px] text-slate-600" style={sans}>
              Under the Directorship of: <strong className="text-[#0F2A4A]">{data.centerHead}</strong>
            </p>
          )}

          <div className="mx-auto max-w-xl rounded-xl border border-[#C4A35A]/40 bg-white p-3 shadow-sm" style={sans}>
            <p className="text-[10px] leading-relaxed text-slate-700">
              Has been thoroughly inspected, evaluated, and granted formal accreditation as an <strong>Authorized Training Centre (ATC)</strong> of the Council to conduct institutional examinations, skill training, and career certification programs.
            </p>
          </div>

          <div className="flex justify-center gap-6 text-[10px] text-slate-700 font-semibold" style={sans}>
            <span>Affiliation Period: <strong className="text-[#163A6B]">{data.trainingStart}</strong> to <strong className="text-[#163A6B]">{data.trainingEnd}</strong></span>
            <span>·</span>
            <span>Status: <strong className="text-emerald-700">ACTIVE & VERIFIED</strong></span>
          </div>
        </div>

        {/* Bottom Section with Seals and Signs */}
        <div className="border-t border-[#C4A35A]/50 pt-3">
          <div className="flex items-end justify-between">
            {/* QR */}
            <div className="flex flex-col items-center">
              <div className="h-[76px] w-[76px] border border-[#163A6B]/50 bg-white p-1 shadow">
                {qrUrl && <img src={qrUrl} alt="QR" className="h-full w-full object-contain" />}
              </div>
              <span className="mt-1 text-[7px] font-semibold text-slate-500" style={sans}>
                Official ATC QR
              </span>
            </div>

            {/* Emblem Seal */}
            <div className="flex flex-col items-center">
              <div className="flex h-[82px] w-[82px] items-center justify-center rounded-full border-4 border-[#C4A35A] bg-gradient-to-br from-amber-100 to-[#C4A35A] shadow-md">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-dashed border-[#57400F] text-center">
                  <span className="text-[7px] font-black uppercase text-[#382603]" style={sans}>IVESDC</span>
                  <span className="text-[6px] font-bold text-[#382603]" style={sans}>AFFILIATED</span>
                  <span className="text-[6px] font-black text-[#382603]" style={sans}>COUNCIL</span>
                </div>
              </div>
              <span className="mt-1 text-[7.5px] font-bold text-[#8B6914]" style={sans}>
                Valid Until: {data.validUntil || data.trainingEnd}
              </span>
            </div>

            {/* Signatures */}
            <div className="flex gap-6 text-center" style={sans}>
              <div>
                <div className="h-8 border-b border-[#163A6B] flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Dr. R. Sandanshiv</span>
                </div>
                <p className="mt-1 text-[8px] font-bold uppercase text-[#163A6B]">National Registrar</p>
                <p className="text-[6.5px] text-slate-500">Accreditation Board</p>
              </div>
              <div>
                <div className="h-8 border-b border-[#163A6B] flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Y. Prajapati</span>
                </div>
                <p className="mt-1 text-[8px] font-bold uppercase text-[#163A6B]">Council Chairman</p>
                <p className="text-[6.5px] text-slate-500">IVESDC Central</p>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center text-[6.5px] text-slate-500" style={sans}>
            <p>{CERT_STATIC.contact} · {CERT_STATIC.registeredOffice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Certificate of Merit & Excellence Template */
export function MeritCertTemplate({ data }: { data: CertificateDemoData }) {
  const W = 723;
  const H = 1024;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    buildQr(
      `IVESDC CERTIFICATE OF MERIT\nAwarded to: ${data.studentName}\nAchievement: ${data.grade}\nCourse: ${data.courseName}\nCenter: ${data.atcName}\nDate: ${data.issueDate}`,
      115
    ).then(setQrUrl).catch(() => setQrUrl(null));
  }, [data]);

  return (
    <div
      id="demo-cert-merit"
      className="certificate-sheet relative mx-auto overflow-hidden bg-[#FCFBF7] shadow-2xl"
      style={{ width: W, height: H }}
    >
      {/* Ornate Gold Filigree Style Border */}
      <div className="absolute inset-3 border-[6px] border-[#9A7426]" />
      <div className="absolute inset-5 border-[2px] border-[#C4A35A]" />
      <div className="absolute inset-[24px] border border-[#9A7426]/30" />

      <div className="absolute inset-[36px] flex flex-col justify-between p-4 text-center" style={serif}>
        {/* Header */}
        <div>
          <img src={CERT_IMAGE.logoSrc} alt="IVESDC" className="mx-auto h-[46px] w-auto object-contain" />
          <h1 className="mt-1 text-[13px] font-black uppercase tracking-[0.03em] text-[#715211]" style={sans}>
            {CERT_STATIC.orgName}
          </h1>
          <p className="text-[7.5px] text-slate-600" style={sans}>
            Recognized by MCA Govt of India · Skill India Mission Partner
          </p>
        </div>

        {/* Title */}
        <div className="my-2">
          <div className="mx-auto flex w-fit items-center gap-3">
            <span className="text-[#C4A35A] text-xl">★</span>
            <span className="text-[26px] font-black uppercase tracking-[0.16em] text-[#4F3605]">
              Certificate of Merit
            </span>
            <span className="text-[#C4A35A] text-xl">★</span>
          </div>
          <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#8B6914]" style={sans}>
            Honoring Exceptional Distinction & Academic Excellence
          </p>
        </div>

        {/* Citation Body */}
        <div className="my-3 space-y-3.5 text-[#2C2108]">
          <p className="text-[12px] italic text-slate-500">This prestigious citation is gratefully presented to</p>
          <p className="text-[22px] font-black uppercase text-[#543905] underline decoration-[#C4A35A] decoration-2 underline-offset-4">
            {data.studentName}
          </p>
          <p className="text-[10.5px] font-medium" style={sans}>
            D/S/O <strong className="font-bold text-[#3B2907]">{data.parentName}</strong>
          </p>

          <p className="mx-auto max-w-lg text-[11px] leading-relaxed text-slate-700" style={sans}>
            in recognition of outstanding academic brilliance, exemplary skill demonstration, and securing top academic distinction in the National Vocational Evaluation of
          </p>

          <div className="mx-auto max-w-lg rounded-xl border-2 border-[#C4A35A] bg-gradient-to-r from-amber-50 via-white to-amber-50 py-3 px-4 shadow-sm">
            <p className="text-[14px] font-black uppercase text-[#715211]" style={sans}>
              {data.courseName}
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#8B6914]" style={sans}>
              Achievement: {data.grade} ({data.marksPercent}% Score)
            </p>
          </div>

          <p className="text-[9.5px] text-slate-600" style={sans}>
            Training Completed at: <strong>{data.atcName}</strong>, {data.trainingCentre}
          </p>
        </div>

        {/* Lower Row */}
        <div className="border-t border-[#C4A35A]/50 pt-3">
          <div className="flex items-end justify-between">
            <div className="flex flex-col items-center">
              <div className="h-[74px] w-[74px] border border-[#9A7426]/50 bg-white p-1 shadow">
                {qrUrl && <img src={qrUrl} alt="QR" className="h-full w-full object-contain" />}
              </div>
              <span className="mt-1 text-[7px] font-semibold text-slate-500" style={sans}>Scan to Verify</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#C4A35A] bg-gradient-to-br from-amber-200 to-[#C4A35A] shadow-md">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-dashed border-[#4F3605] text-center">
                  <span className="text-[8px] font-black text-[#382603]">GOLD</span>
                  <span className="text-[6.5px] font-bold text-[#382603]">MEDALIST</span>
                  <span className="text-[6px] font-bold text-[#382603]">HONOR</span>
                </div>
              </div>
              <span className="mt-1 text-[7.5px] font-bold text-[#8B6914]" style={sans}>Awarded: {data.issueDate}</span>
            </div>

            <div className="flex gap-6 text-center" style={sans}>
              <div>
                <div className="h-8 border-b border-[#9A7426] flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Dr. R. Sandanshiv</span>
                </div>
                <p className="mt-1 text-[8px] font-bold uppercase text-[#715211]">Academic Dean</p>
              </div>
              <div>
                <div className="h-8 border-b border-[#9A7426] flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Y. Prajapati</span>
                </div>
                <p className="mt-1 text-[8px] font-bold uppercase text-[#715211]">Council President</p>
              </div>
            </div>
          </div>

          <p className="mt-2 text-[6.5px] text-slate-500" style={sans}>{CERT_STATIC.contact}</p>
        </div>
      </div>
    </div>
  );
}

/** Workshop & Bootcamp Participation Certificate */
export function WorkshopCertTemplate({ data }: { data: CertificateDemoData }) {
  const W = 723;
  const H = 1024;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    buildQr(
      `IVESDC BOOTCAMP COMPLETION\nParticipant: ${data.studentName}\nWorkshop: ${data.courseName}\nDuration: ${data.duration || "40 Hours"}\nDate: ${data.issueDate}\nVerify: verify.iveskillcouncil@gmail.com`,
      115
    ).then(setQrUrl).catch(() => setQrUrl(null));
  }, [data]);

  return (
    <div
      id="demo-cert-workshop"
      className="certificate-sheet relative mx-auto overflow-hidden bg-white shadow-2xl"
      style={{ width: W, height: H }}
    >
      {/* Modern Gradient Slate & Cyan Frame */}
      <div className="absolute inset-3 border-[4px] border-[#0F2A4A]" />
      <div className="absolute inset-5 border border-sky-400" />
      <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-[#0F2A4A] via-sky-600 to-[#C4A35A]" />

      <div className="absolute inset-[32px] flex flex-col justify-between p-4" style={sans}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <img src={CERT_IMAGE.logoSrc} alt="IVESDC" className="h-[44px] w-auto object-contain" />
          <div className="text-right">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[8.5px] font-black uppercase text-sky-800">
              Technical Skill Bootcamp
            </span>
            <p className="mt-1 text-[7px] text-slate-500">ISO 9001:2015 Certified Educational Council</p>
          </div>
        </div>

        {/* Title */}
        <div className="my-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0F2A4A]">Certificate of Participation</p>
          <h2 className="mt-1 text-[24px] font-black tracking-tight text-[#0F2A4A]">
            Technical Workshop & Hands-on Lab
          </h2>
          <div className="mx-auto mt-1 h-1 w-20 rounded bg-[#C4A35A]" />
        </div>

        {/* Body */}
        <div className="my-2 space-y-3 text-center">
          <p className="text-[11px] text-slate-500">This credential certifies that</p>
          <p className="text-[20px] font-black uppercase text-[#0F2A4A] underline decoration-sky-500 decoration-2 underline-offset-4">
            {data.studentName}
          </p>
          <p className="text-[10px] text-slate-600">
            Has successfully completed the intensive hands-on practical training program:
          </p>

          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 shadow-sm">
            <h3 className="text-[13px] font-black text-[#0F2A4A]">{data.courseName}</h3>
            <p className="mt-1 text-[9px] font-semibold text-slate-600">
              Total Duration: {data.duration || "40 Intensive Hours"} · Hands-on Practical Projects
            </p>
          </div>

          <div className="mx-auto flex max-w-md justify-center gap-8 text-[9.5px] text-slate-600">
            <span>Session: <strong>{data.trainingStart}</strong> to <strong>{data.trainingEnd}</strong></span>
            <span>·</span>
            <span>Issued: <strong>{data.issueDate}</strong></span>
          </div>

          <p className="text-[9px] text-slate-500">
            Organized & certified by <strong>{data.atcName}</strong> in association with IVESDC Technical Training Board.
          </p>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="h-[68px] w-[68px] border border-slate-300 bg-white p-1">
                {qrUrl && <img src={qrUrl} alt="QR" className="h-full w-full object-contain" />}
              </div>
              <div className="text-[7.5px] text-slate-600">
                <p className="font-bold text-[#0F2A4A]">Verified Certificate</p>
                <p>Credential ID: <span className="font-mono">{data.certificateNumber}</span></p>
              </div>
            </div>

            <div className="flex gap-6 text-center text-[8px]">
              <div>
                <div className="h-7 border-b border-slate-400 flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Lead Instructor</span>
                </div>
                <p className="mt-0.5 font-bold uppercase text-slate-700">Workshop Mentor</p>
              </div>
              <div>
                <div className="h-7 border-b border-slate-400 flex items-end justify-center pb-0.5">
                  <span className="font-serif italic text-blue-900">Y. Prajapati</span>
                </div>
                <p className="mt-0.5 font-bold uppercase text-[#0F2A4A]">Council Director</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
