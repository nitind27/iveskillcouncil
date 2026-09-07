/** Official IVESDC certificate sheet size (matches print frame) */
export const CERT_IMAGE = {
  src: "/certificates/ivesdc-border-only.jpg?v=2",
  width: 723,
  height: 1024,
  logoSrc: "/certificates/ivesdc-logo-cert.png",
} as const;

export const CERT_STATIC = {
  orgName: "INSTITUTE OF VOCATION EDUCATION AND SKILL DEVELOPMENT COUNCIL",
  accreditation: [
    "An Autonomous Body Registered under Section 8 of the Companies Act, 2013, Ministry of Corporate Affairs, Government of India, and Registered under N.C.T Govt. of India, New Delhi.",
    "ISO 21001:2018 & ISO 9001:2015 Certified Organization",
    "Accredited By: NSDC Training Partner",
  ],
  officeAddress:
    "Office Address: 2nd Floor, Vimla Nivas, Near New Bank of Baroda, Junagam Main Road, Fort-Songadh. Under the General Administration Vibhait Department, Government of Gujarat Certificate according to Letter No.CRR-10-2007-120320, G.P. New Sachivalaya, Gandhinagar, Date: 13-08-2008.",
  signatory: "HEAD OF THE INSTITUTE (ATC) EXAM EXECUTIVE",
  affiliationsTitle: "GOVERNMENT RECOGNITIONS & AFFILIATIONS",
  contact: "www.iveskillcouncil.edu.in  |  verify.iveskillcouncil@gmail.com  |  +91 9925222523",
  gradeSystem:
    "Grade System: A+ : Excellent (85% & Above)  |  A : Very Good (70% to 84%)  |  B : Good (55% to 69%)  |  C : Average (40% to 54%)",
  registeredOffice:
    "Registered Office: F-107, Dev Krishna Residency, Gunsada, Sub. Dist.-Ukai, Dist.-Tapi, Gujarat – 394670",
} as const;

export function buildAchievementText(
  courseName: string,
  grade: string,
  marksPercent: number | null
) {
  if (marksPercent != null && marksPercent > 0) {
    return `Has successfully completed the Course on ${courseName} and obtained Grade ${grade} (${marksPercent}% Marks).`;
  }
  return `Has successfully completed the Course on ${courseName}.`;
}

export function buildCertificateQrPayload(data: {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  grade: string;
  marksPercent: number | null;
  issueDate: string;
  atcName: string;
}) {
  const marks =
    data.marksPercent != null && data.marksPercent > 0
      ? `${data.marksPercent}%`
      : "—";
  return [
    "IVESDC Certificate Verification",
    `Certificate No: ${data.certificateNumber}`,
    `Name: ${data.studentName}`,
    `Course: ${data.courseName}`,
    `Grade: ${data.grade} (${marks})`,
    `ATC: ${data.atcName}`,
    `Issue Date: ${data.issueDate}`,
    "verify.iveskillcouncil@gmail.com",
    "www.iveskillcouncil.edu.in",
  ].join("\n");
}
