export type CertificateTypeId =
  | "vocational"
  | "diploma"
  | "marksheet"
  | "marksheet2"
  | "affiliation"
  | "merit"
  | "workshop";

export interface CertificateTypeConfig {
  id: CertificateTypeId;
  title: string;
  badge: string;
  badgeColor: string;
  category: string;
  description: string;
  orientation: "portrait" | "landscape";
  sampleData: CertificateDemoData;
}

export interface MarksheetSubject {
  code: string;
  name: string;
  maxTheory: number;
  marksTheory: number;
  maxPractical: number;
  marksPractical: number;
  totalMax: number;
  totalObtained: number;
  grade: string;
}

export interface GradeSystemRow {
  grade: string;
  label: string;
  range: string;
}

export interface PartnerLogoItem {
  id: string;
  name: string;
  url: string;
  height?: number;
}

export const DEFAULT_PARTNER_LOGOS: PartnerLogoItem[] = [
  { id: "p1", name: "Ministry of Corporate Affairs", url: "/cert/partners/1-mca.png" },
  { id: "p2", name: "NITI Aayog", url: "/cert/partners/2-niti-aayog.png" },
  { id: "p3", name: "Skill India", url: "/cert/partners/3-skill-india.png" },
  { id: "p4", name: "NSDC", url: "/cert/partners/4-nsdc.png" },
  { id: "p5", name: "Telecom Sector Skill Council", url: "/cert/partners/5-telecom.png" },
  { id: "p6", name: "MSME", url: "/cert/partners/6-msme.png" },
  { id: "p7", name: "Startup India", url: "/cert/partners/7-startup-india.png" },
  { id: "p8", name: "NGO DARPAN", url: "/cert/partners/8-ngo-darpan.png" },
];

export interface CertificateDemoData {
  id: string;
  serialNumber: string;
  certificateNumber: string;
  registrationNumber: string;
  rollNumber?: string;
  barcodeNumber?: string;
  barcodeTextWords?: string;
  showEnrollmentBarcode?: boolean;
  studentName: string;
  parentName: string;
  fatherName?: string;
  motherName?: string;
  place?: string;
  photoUrl?: string;
  studentSignatureUrl?: string;
  directorSignatureUrl?: string;
  directorTitle?: string;
  stampUrl?: string;
  logoUrl?: string;
  isoSealUrl?: string;
  partnerLogosUrl?: string;
  partnerLogos?: PartnerLogoItem[];
  goldMedalUrl?: string;
  customBorderUrl?: string;
  customBannerUrl?: string;
  borderStyle?: "ornate" | "guilloche";
  instituteName?: string;
  tagline?: string;
  accreditationLine1?: string;
  accreditationLine2?: string;
  accreditationLine3?: string;
  courseName: string;
  courseCode?: string;
  duration?: string;
  atcCode: string;
  atcName: string;
  trainingCentre: string;
  trainingCentreName: string;
  franchiseAddress: string;
  trainingStart: string;
  trainingEnd: string;
  issueDate: string;
  validUntil?: string;
  grade: string;
  gradeLabel: string;
  marksPercent: number;
  division?: string;
  session?: string;
  status: string;
  subjects?: MarksheetSubject[];
  workshopHours?: number;
  accreditationLevel?: string;
  centerHead?: string;
  registeredOffice?: string;
  govOrderText?: string;
  verificationWebsite?: string;
  verificationEmail?: string;
  gradeSystem?: GradeSystemRow[];

  // Dynamic Sizing & Dimensions (px)
  logoHeight?: number;
  logoWidth?: number;
  isoSealSize?: number;
  partnerLogosHeight?: number;
  photoWidth?: number;
  photoHeight?: number;
  studentSigHeight?: number;
  directorSigHeight?: number;
  authorizedSigHeight?: number;
  stampSize?: number;
  goldMedalSize?: number;
  qrCodeSize?: number;
  titleFontSize?: number;
  bannerHeight?: number;
  bannerWidth?: number;

  // Dynamic Inner Content Font Sizing & Typography
  innerFontScale?: number;
  candidateFontSize?: number;
  tableFontSize?: number;
  certBodyFontSize?: number;
  studentNameFontSize?: number;

  // Dynamic Workspace Padding & Layout Spacing (px)
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  headerSpacing?: number;
  contentSpacing?: number;

  // Dynamic Watermark & Security Background
  watermarkType?: "crest" | "tiled-grid" | "none";
  watermarkOpacity?: number;
  watermarkColor?: string;
}

export const SAMPLE_CERTIFICATE_PRESETS: Record<CertificateTypeId, CertificateDemoData> = {
  vocational: {
    id: "demo-vocational",
    serialNumber: "IVESDC/CERT/2025/000123",
    certificateNumber: "IVESDC/CERT/2025/000123",
    registrationNumber: "4739846",
    studentName: "Demo Student",
    parentName: "Demo Father Name and Demo Mother Name",
    fatherName: "Demo Father Name",
    motherName: "Demo Mother Name",
    place: "Gandhinagar, Gujarat",
    photoUrl: "/cert/sample-student-photo.png",
    studentSignatureUrl: "/cert/sample-student-sig.png",
    directorSignatureUrl: "/cert/sig-director.png",
    directorTitle: "Director",
    stampUrl: "/cert/stamp-blue.png",
    logoUrl: "/cert/ivesdc-logo.png?v=clean",
    isoSealUrl: "/cert/iso-seal.png",
    partnerLogosUrl: "/cert/partner-logos.png",
    partnerLogos: DEFAULT_PARTNER_LOGOS,
    goldMedalUrl: "/cert/seal-gold-medal.png",
    courseName: "Computer Diploma Course",
    courseCode: "CDC-04M",
    duration: "4 Months (03 Jan 2025 to 02 May 2025)",
    atcCode: "ATC00042",
    atcName: "National Institute of Vocational Excellence",
    trainingCentre: "Gandhinagar, Gujarat",
    trainingCentreName: "National Institute of Vocational Excellence",
    franchiseAddress: "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680",
    trainingStart: "03 January 2025",
    trainingEnd: "02 May 2025",
    issueDate: "02 May 2025",
    grade: "A+",
    gradeLabel: "Distinction (85% & Above)",
    marksPercent: 85.13,
    status: "ISSUED",
    borderStyle: "ornate",
    instituteName: "INSTITUTE OF VOCATIONAL EDUCATION AND SKILL DEVELOPMENT COUNCIL",
    tagline: "Building a Skilled and Self-Reliant Nation",
    accreditationLine1: "An Autonomous Body Registered under Section 8 of the Companies Act, 2013",
    accreditationLine2: "Ministry of Corporate Affairs, Government of India",
    accreditationLine3: "ISO 9001:2015 & ISO 21001:2018 Certified Organization",
    registeredOffice: "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680",
    verificationWebsite: "www.iveskillcouncil.edu.in",
    verificationEmail: "official.iveskillcouncil@gmail.com",
    innerFontScale: 100,
    certBodyFontSize: 15.5,
    studentNameFontSize: 44,
    paddingTop: 66,
    paddingBottom: 68,
    paddingLeft: 58,
    paddingRight: 58,
    headerSpacing: 8,
    contentSpacing: 10,
    watermarkType: "none",
    watermarkOpacity: 0.04,
    watermarkColor: "#0E2A54",
  },
  diploma: {
    id: "demo-diploma",
    serialNumber: "000523",
    certificateNumber: "IVESDC/DIP/2026/0128",
    registrationNumber: "REG-GJ-2025-3319",
    rollNumber: "DIP-2025-042",
    studentName: "Pooja Bharatbhai Patel",
    parentName: "Bharatbhai Somabhai Patel",
    courseName: "Advance Diploma in Computer Applications & Software Management (ADCA)",
    courseCode: "ADCA-12M",
    duration: "1 Year / 2 Semesters (720 Hours)",
    atcCode: "ATC00018",
    atcName: "National Institute of Vocational Excellence",
    trainingCentre: "Surat City, Gujarat",
    trainingCentreName: "National Institute of Vocational Excellence",
    franchiseAddress: "Ring Road, Surat, Gujarat – 395002",
    trainingStart: "10 Jan 2025",
    trainingEnd: "10 Jan 2026",
    issueDate: "28 Jan 2026",
    grade: "A+",
    gradeLabel: "First Division with Honors",
    marksPercent: 92,
    division: "First Class with Distinction",
    status: "ISSUED",
  },
  marksheet: {
    id: "demo-marksheet",
    serialNumber: "IVESDC/MS/2025/000123",
    certificateNumber: "IVESDC/MS/2025/000123",
    registrationNumber: "4739846",
    barcodeNumber: "4739846",
    barcodeTextWords: "FOUR  SEVEN  THREE  NINE  EIGHT  FOUR  SIX",
    rollNumber: "4739846",
    session: "2025 – 2026",
    studentName: "Yashvantbhai Prajapati",
    parentName: "Panditbhai Prajapati and Latkanben Prajapati",
    fatherName: "Panditbhai Prajapati",
    motherName: "Latkanben Prajapati",
    place: "Gandhinagar, Gujarat",
    photoUrl: "/cert/sample-student-photo.png",
    studentSignatureUrl: "/cert/sample-student-sig.png",
    directorSignatureUrl: "/cert/sig-director.png",
    directorTitle: "Director Signature",
    stampUrl: "/cert/stamp-blue.png",
    logoUrl: "/cert/ivesdc-logo.png?v=clean",
    isoSealUrl: "/cert/iso-seal.png",
    partnerLogosUrl: "/cert/partner-logos.png",
    partnerLogos: DEFAULT_PARTNER_LOGOS,
    courseName: "Computer Diploma Course",
    courseCode: "CDC-03M",
    duration: "03 Months",
    atcCode: "IVESDC/ATC/2025/001",
    atcName: "IVESDC Authorized Training Centre",
    trainingCentre: "Songadh, Tal. Songadh, Dist. Tapi, Gujarat - 394670",
    trainingCentreName: "IVESDC Authorized Training Centre",
    franchiseAddress: "Songadh, Tal. Songadh, Dist. Tapi, Gujarat - 394670",
    trainingStart: "03 February 2025",
    trainingEnd: "02 May 2025",
    issueDate: "02 May 2025",
    grade: "A+",
    gradeLabel: "Excellent (85% & Above)",
    marksPercent: 85.13,
    division: "First Class with Distinction",
    status: "PASS",
    borderStyle: "guilloche",
    instituteName: "INSTITUTE OF VOCATIONAL EDUCATION AND SKILL DEVELOPMENT COUNCIL",
    tagline: "Building a Skilled and Self-Reliant Nation",
    accreditationLine1: "An Autonomous Body Registered under Section 8 of the Companies Act, 2013",
    accreditationLine2: "Ministry of Corporate Affairs, Government of India",
    accreditationLine3: "ISO 9001:2015 & ISO 21001:2018 Certified Organization",
    registeredOffice: "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680",
    govOrderText: "Under the General Adm Vahiwat Dept.\nGovt. of Gujarat Certificate According to\nLetter No. CRR - 10 - 2007 - 120520\nG.P. New Sachivalaya Gandhinagar\nDate : 13-8-2008",
    verificationWebsite: "www.iveskillcouncil.edu.in",
    verificationEmail: "official.iveskillcouncil@gmail.com",
    gradeSystem: [
      { grade: "A+", label: "Excellent", range: "85% & Above" },
      { grade: "A", label: "Very Good", range: "70% to 84%" },
      { grade: "B", label: "Good", range: "55% to 69%" },
      { grade: "C", label: "Average", range: "40% to 54%" },
      { grade: "D", label: "Below Average", range: "Below 40%" },
    ],
    logoHeight: 92,
    logoWidth: 195,
    isoSealSize: 92,
    partnerLogosHeight: 46,
    photoWidth: 138,
    photoHeight: 152,
    studentSigHeight: 36,
    directorSigHeight: 44,
    stampSize: 82,
    qrCodeSize: 76,
    titleFontSize: 20.5,
    bannerHeight: 54,
    bannerWidth: 387,
    innerFontScale: 100,
    candidateFontSize: 13,
    tableFontSize: 12,
    studentNameFontSize: 14,
    paddingTop: 48,
    paddingBottom: 42,
    paddingLeft: 56,
    paddingRight: 56,
    headerSpacing: 6,
    contentSpacing: 8,
    watermarkType: "none",
    watermarkOpacity: 0.045,
    watermarkColor: "#0E2A54",
    subjects: [
      {
        code: "SUB-01",
        name: "Fundamentals of Computer",
        maxTheory: 100,
        marksTheory: 86,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 86,
        grade: "86%",
      },
      {
        code: "SUB-02",
        name: "Operating System (Windows)",
        maxTheory: 100,
        marksTheory: 82,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 82,
        grade: "82%",
      },
      {
        code: "SUB-03",
        name: "MS Word",
        maxTheory: 100,
        marksTheory: 88,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 88,
        grade: "88%",
      },
      {
        code: "SUB-04",
        name: "MS Excel",
        maxTheory: 100,
        marksTheory: 90,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 90,
        grade: "90%",
      },
      {
        code: "SUB-05",
        name: "MS PowerPoint",
        maxTheory: 100,
        marksTheory: 85,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 85,
        grade: "85%",
      },
      {
        code: "SUB-06",
        name: "Internet & Email",
        maxTheory: 100,
        marksTheory: 80,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 80,
        grade: "80%",
      },
      {
        code: "SUB-07",
        name: "Digital Financial Literacy",
        maxTheory: 100,
        marksTheory: 78,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 78,
        grade: "78%",
      },
      {
        code: "SUB-08",
        name: "Practical / Project Work",
        maxTheory: 100,
        marksTheory: 92,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 92,
        grade: "92%",
      },
    ],
  },
  marksheet2: {
    id: "demo-marksheet2",
    serialNumber: "IVESDC/MS/2025/000123",
    certificateNumber: "IVESDC/MS/2025/000123",
    registrationNumber: "4739846",
    barcodeNumber: "4739846",
    rollNumber: "4739846",
    session: "2025 – 2026",
    studentName: "Yashvantbhai Prajapati",
    parentName: "Panditbhai Prajapati and Latkanben Prajapati",
    fatherName: "Panditbhai Prajapati",
    motherName: "Latkanben Prajapati",
    place: "Gandhinagar, Gujarat",
    photoUrl: "/cert/sample-student-photo.png",
    directorSignatureUrl: "/cert/sig-director.png",
    directorTitle: "Director Signature",
    stampUrl: "/cert/stamp-blue.png?v=clean",
    logoUrl: "/cert/ivesdc-logo.png?v=clean",
    customBorderUrl: "/border/ONLY_OUTSIDE_FLORAL_BORDER.svg",
    courseName: "Computer Diploma Course",
    courseCode: "CDC-03M",
    duration: "03 Months",
    atcCode: "IVESDC/ATC/2025/001",
    atcName: "IVESDC Authorized Training Centre",
    trainingCentre: "Songadh, Tal. Songadh, Dist. Tapi, Gujarat - 394670",
    trainingCentreName: "IVESDC Authorized Training Centre",
    franchiseAddress: "Songadh, Tal. Songadh, Dist. Tapi, Gujarat - 394670",
    trainingStart: "03 February 2025",
    trainingEnd: "02 May 2025",
    issueDate: "02 May 2025",
    grade: "A+",
    gradeLabel: "Excellent (85% & Above)",
    marksPercent: 85.13,
    division: "First Class with Distinction",
    status: "PASS",
    borderStyle: "guilloche",
    instituteName: "INSTITUTE OF VOCATIONAL EDUCATION AND SKILL DEVELOPMENT COUNCIL",
    tagline: "Building a Skilled and Self-Reliant Nation",
    accreditationLine1:
      "An Autonomous Body Registered under Section 8 of the Companies Act, 2013,",
    accreditationLine2:
      "Ministry of Corporate Affairs, Government of India, ISO 21001:2018 & ISO 9001:2015 Certified Organization",
    accreditationLine3: "",
    registeredOffice:
      "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680",
    govOrderText:
      "Under The General Administration Department\nGovt. of Gujarat vide it's Resolution\nGR No. CRR /10/2007/120320/G5, Dt :13-8-2008\nby Sachivalay Gandhinagar",
    verificationWebsite: "www.iveskillcouncil.edu.in",
    verificationEmail: "official.iveskillcouncil@gmail.com",
    gradeSystem: [
      { grade: "A+", label: "Excellent", range: "85% & Above" },
      { grade: "A", label: "Very Good", range: "70% to 84%" },
      { grade: "B", label: "Good", range: "55% to 69%" },
      { grade: "C", label: "Average", range: "40% to 54%" },
    ],
    logoHeight: 86,
    logoWidth: 175,
    photoWidth: 128,
    photoHeight: 158,
    directorSigHeight: 38,
    stampSize: 70,
    qrCodeSize: 72,
    titleFontSize: 22,
    customBannerUrl: undefined,
    bannerHeight: 48,
    bannerWidth: 340,
    barcodeTextWords: "FOUR  SEVEN  THREE  NINE  EIGHT  FOUR  SIX",
    innerFontScale: 100,
    candidateFontSize: 13,
    tableFontSize: 12,
    studentNameFontSize: 14,
    paddingTop: 67,
    paddingBottom: 67,
    paddingLeft: 67,
    paddingRight: 67,
    headerSpacing: 6,
    contentSpacing: 8,
    watermarkType: "none",
    watermarkOpacity: 0,
    subjects: [
      {
        code: "SUB-01",
        name: "Fundamentals of Computer",
        maxTheory: 100,
        marksTheory: 86,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 86,
        grade: "86%",
      },
      {
        code: "SUB-02",
        name: "Operating System (Windows)",
        maxTheory: 100,
        marksTheory: 82,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 82,
        grade: "82%",
      },
      {
        code: "SUB-03",
        name: "MS Word",
        maxTheory: 100,
        marksTheory: 88,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 88,
        grade: "88%",
      },
      {
        code: "SUB-04",
        name: "MS Excel",
        maxTheory: 100,
        marksTheory: 90,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 90,
        grade: "90%",
      },
      {
        code: "SUB-05",
        name: "MS PowerPoint",
        maxTheory: 100,
        marksTheory: 85,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 85,
        grade: "85%",
      },
      {
        code: "SUB-06",
        name: "Internet & Email",
        maxTheory: 100,
        marksTheory: 80,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 80,
        grade: "80%",
      },
      {
        code: "SUB-07",
        name: "Digital Financial Literacy",
        maxTheory: 100,
        marksTheory: 78,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 78,
        grade: "78%",
      },
      {
        code: "SUB-08",
        name: "Practical / Project Work",
        maxTheory: 100,
        marksTheory: 92,
        maxPractical: 0,
        marksPractical: 0,
        totalMax: 100,
        totalObtained: 92,
        grade: "92%",
      },
    ],
  },
  affiliation: {
    id: "demo-affiliation",
    serialNumber: "ATC-AFF-0428",
    certificateNumber: "IVESDC/ATC-AFF/2026/0042",
    registrationNumber: "ATC-REG-GJ-042",
    studentName: "Swami Vivekananda Skill Development Academy",
    parentName: "Administered by Sarvottam Educational Trust",
    centerHead: "Dr. Arvind K. Joshi (Director / Centre Head)",
    courseName: "Authorized Training Centre (ATC) Affiliation Certificate",
    atcCode: "ATC00042",
    atcName: "Swami Vivekananda Skill Development Academy",
    trainingCentre: "Songadh, Dist. Tapi, Gujarat",
    trainingCentreName: "Swami Vivekananda Skill Development Academy",
    franchiseAddress: "Sai Complex, Main Station Road, Fort-Songadh, Tapi, Gujarat – 394670",
    trainingStart: "01 Apr 2025",
    trainingEnd: "31 Mar 2028",
    issueDate: "01 Apr 2025",
    validUntil: "31 Mar 2028",
    grade: "Grade 'A' Accredited",
    gradeLabel: "Verified ATC",
    marksPercent: 100,
    accreditationLevel: "Grade 'A' National Vocational Centre",
    status: "ISSUED",
  },
  merit: {
    id: "demo-merit",
    serialNumber: "MERIT-2026-081",
    certificateNumber: "IVESDC/MERIT/2026/0019",
    registrationNumber: "REG-MH-2025-1049",
    studentName: "Sneha Deepak Kulkarni",
    parentName: "Deepak V. Kulkarni",
    courseName: "All India Skill Championship — Full Stack Web Engineering",
    atcCode: "ATC00007",
    atcName: "Pune Central Vocational Technology Hub",
    trainingCentre: "Pune, Maharashtra",
    trainingCentreName: "Pune Central Vocational Technology Hub",
    franchiseAddress: "FC Road, Shivajinagar, Pune – 411005",
    trainingStart: "15 Jan 2026",
    trainingEnd: "20 Feb 2026",
    issueDate: "25 Feb 2026",
    grade: "1st Rank (Gold Medalist)",
    gradeLabel: "Outstanding Academic Merit",
    marksPercent: 96,
    division: "National First Rank Holder",
    status: "ISSUED",
  },
  workshop: {
    id: "demo-workshop",
    serialNumber: "WS-2026-1102",
    certificateNumber: "IVESDC/BOOT/2026/0204",
    registrationNumber: "WS-REG-2026-902",
    studentName: "Mohammad Farhan Ansari",
    parentName: "Abdul Rasheed Ansari",
    courseName: "Intensive 40-Hour Bootcamp on Next.js 15, AI Agents & Cloud Deployments",
    duration: "40 Intensive Hours",
    workshopHours: 40,
    atcCode: "ATC00012",
    atcName: "IVESDC National Digital Skill Lab",
    trainingCentre: "Songadh, Gujarat (Hybrid Session)",
    trainingCentreName: "IVESDC National Digital Skill Lab",
    franchiseAddress: "Central Technology Campus, Gujarat",
    trainingStart: "10 Feb 2026",
    trainingEnd: "22 Feb 2026",
    issueDate: "23 Feb 2026",
    grade: "Completed with Distinction",
    gradeLabel: "Certified Participant",
    marksPercent: 94,
    status: "ISSUED",
  },
};

export const CERTIFICATE_TYPE_CONFIGS: CertificateTypeConfig[] = [
  {
    id: "vocational",
    title: "Certificate of Completion",
    badge: "Official Cert",
    badgeColor: "bg-blue-100 text-[#1E4A85] border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
    category: "Certificate Layout",
    description: "Official IVESDC completion certificate with authentic ornate gold & navy border, crest watermark, seals, and QR verification.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.vocational,
  },
  {
    id: "marksheet",
    title: "Statement of Marks (Result)",
    badge: "Official Result",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
    category: "Result Layout",
    description: "Official IVESDC marksheet with matching ornate border, 8-subject marks grid, barcode, PASS status, and QR verification.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.marksheet,
  },
  {
    id: "marksheet2",
    title: "Statement of Marks (Result) - 2",
    badge: "Result Form 2",
    badgeColor: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800/60 dark:text-slate-200",
    category: "Blank Form Layout",
    description: "Classic silver lace border Statement of Marks form with Gothic title, NSQF bar, GRADE OBTAINED row, and Examination Coordinator signature.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.marksheet2,
  },
  {
    id: "diploma",
    title: "Advance Diploma Certificate",
    badge: "Diploma",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
    category: "1-Year Diploma",
    description: "Ornate gold & navy professional diploma certificate for 1-year / 2-semester programs like ADCA and PGDCA.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.diploma,
  },
  {
    id: "affiliation",
    title: "ATC Franchise Affiliation",
    badge: "Accreditation",
    badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300",
    category: "Franchise Centre",
    description: "Authorised Training Centre (ATC) center authorization and accreditation certificate issued to franchise partners.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.affiliation,
  },
  {
    id: "merit",
    title: "Certificate of Merit & Excellence",
    badge: "Honor Award",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300",
    category: "High Distinction",
    description: "Prestigious award certificate for batch toppers, scholarship winners, and outstanding skill accomplishments.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.merit,
  },
  {
    id: "workshop",
    title: "Workshop & Bootcamp Certificate",
    badge: "Bootcamp",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300",
    category: "Short-Term Training",
    description: "Modern credential for hands-on technical workshops, masterclasses, and skill seminars.",
    orientation: "portrait",
    sampleData: SAMPLE_CERTIFICATE_PRESETS.workshop,
  },
];
