import nodemailer from "nodemailer";

export interface FranchiseCredentialsEmailParams {
  franchiseName: string;
  franchiseId?: string;
  loginUrl: string;
  email: string;
  password: string;
  planName: string;
  ownerName: string;
  phone?: string | null;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  /** PDF buffer to attach. If provided, will be attached as credentials.pdf */
  pdfBuffer?: Buffer;
  /** When true: do NOT send password. Add first-time OTP setup instructions instead. */
  firstTimeSetup?: boolean;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function getFranchiseCredentialsHtml(params: FranchiseCredentialsEmailParams): string {
  const { franchiseName, loginUrl, email, password, planName, ownerName, phone, subscriptionStart, subscriptionEnd, address, city, state, pincode, franchiseId, firstTimeSetup } = params;
  const addressLine = [address, city, state, pincode].filter(Boolean).join(", ");
  const showPassword = !firstTimeSetup && password;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Franchise Login Credentials</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Franchise Institute</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your account has been created</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">Hello <strong>${escapeHtml(ownerName)}</strong>,</p>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">Your franchise <strong>${escapeHtml(franchiseName)}</strong> has been registered. ${firstTimeSetup ? "To set up your account, visit the login page and enter your email to receive an OTP. After OTP verification, you will set your password." : "Use the credentials below to sign in."}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Franchise</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(franchiseName)}</td></tr>
                      ${franchiseId ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Franchise ID</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${escapeHtml(franchiseId)}</td></tr>` : ""}
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subscription Plan</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(planName)}</td></tr>
                      ${subscriptionStart ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subscription</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${escapeHtml(subscriptionStart)} – ${escapeHtml(subscriptionEnd || "")}</td></tr>` : ""}
                      ${phone ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Phone</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(phone)}</td></tr>` : ""}
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Login URL</td><td style="padding: 6px 0;"><a href="${escapeHtml(loginUrl)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(loginUrl)}</a></td></tr>
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Username (Email)</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(email)}</td></tr>
                      ${showPassword ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Password</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; font-family: monospace;">${escapeHtml(password)}</td></tr>` : ""}
                      ${addressLine ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Address</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(addressLine)}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              ${firstTimeSetup ? `<p style="margin: 24px 0 0; color: #059669; font-size: 14px; font-weight: 600;">First-time setup: Visit login page → Enter your email → Receive OTP → Verify OTP → Set your password → Login.</p>` : "<p style=\"margin: 24px 0 0; color: #6b7280; font-size: 13px;\">Please change your password after first login. Keep these credentials secure.</p>"}
              ${params.pdfBuffer ? `<p style="margin: 16px 0 0; color: #059669; font-size: 13px;">📎 A PDF with all details is attached to this email.</p>` : ""}
              <p style="margin: 24px 0 0;"><a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Sign In</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center;">
              Franchise Institute Management System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendFranchiseCredentialsEmail(
  to: string,
  params: FranchiseCredentialsEmailParams
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured" };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const appName = process.env.APP_NAME || "Franchise Institute";
  const textParts = [
    `Hello ${params.ownerName},`,
    "",
    `Your franchise ${params.franchiseName} has been registered.`,
    "",
    "Login:",
    `  Email: ${params.email}`,
    ...(!params.firstTimeSetup && params.password ? [`  Password: ${params.password}`] : []),
    `  Login URL: ${params.loginUrl}`,
    "",
    `Plan: ${params.planName}`,
  ];
  if (params.firstTimeSetup) {
    textParts.push("", "First-time setup: Visit the login page, enter your email to receive OTP, verify OTP, then set your password.");
  } else {
    textParts.push("", "Please change your password after first login.");
  }
  if (params.franchiseId) textParts.push(`Franchise ID: ${params.franchiseId}`);
  if (params.phone) textParts.push(`Phone: ${params.phone}`);
  if (params.subscriptionStart) textParts.push(`Subscription: ${params.subscriptionStart} – ${params.subscriptionEnd || ""}`);
  if (params.address || params.city) {
    textParts.push(`Address: ${[params.address, params.city, params.state, params.pincode].filter(Boolean).join(", ")}`);
  }
  if (!params.firstTimeSetup) textParts.push("", "Please change your password after first login. Keep these credentials secure.");
  if (params.pdfBuffer) textParts.push("", "A PDF with all details is attached to this email.");

  const attachments = params.pdfBuffer
    ? [{ filename: "franchise-credentials.pdf", content: params.pdfBuffer }]
    : undefined;

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `Your ${appName} login credentials – ${params.franchiseName}`,
      html: getFranchiseCredentialsHtml(params),
      text: textParts.join("\n"),
      attachments,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/** Params for course enrolment / Enquire Now notification to super admin */
export interface EnrollmentNotificationParams {
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  message?: string | null;
  address?: string | null;
  pincode?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
}

function getEnrollmentNotificationHtml(params: EnrollmentNotificationParams): string {
  const { fullName, email, phone, courseName, message, address, pincode, area, city, state } = params;
  const hasAddress = address || pincode || area || city || state;
  const addressLine = [address, [area, city, state].filter(Boolean).join(", "), pincode].filter(Boolean).join(" · ");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Course Enquiry</title></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden;">
        <tr><td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">New Course Enquiry</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">User Panel – Enquire Now</p>
        </td></tr>
        <tr><td style="padding: 28px 32px;">
          <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">A new course enquiry has been submitted.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <tr><td style="padding: 20px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Name</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(fullName)}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 6px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #3b82f6;">${escapeHtml(email)}</a></td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Phone</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(phone)}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Course(s)</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(courseName)}</td></tr>
                ${hasAddress ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px; vertical-align: top;">Address</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(addressLine)}</td></tr>` : ""}
                ${message ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px; vertical-align: top;">Message</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(message)}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
          <p style="margin: 20px 0 0; color: #64748b; font-size: 12px;">View all enquiries in the super admin panel.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Params for student welcome / credentials email */
export interface StudentWelcomeEmailParams {
  fullName: string;
  email: string;
  password?: string;
  loginUrl: string;
  courseName: string;
  franchiseName: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  admissionDate: string;
  studentCode?: string;
  phone?: string | null;
  address?: string | null;
  area?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
  initialPaymentAmount?: number;
  /** When true, email is course/fee update (no credentials block) */
  courseUpdateOnly?: boolean;
}

function formatInr(n: number): string {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getStudentWelcomeHtml(params: StudentWelcomeEmailParams): string {
  const {
    fullName,
    email,
    password,
    loginUrl,
    courseName,
    franchiseName,
    totalFee,
    paidFee,
    pendingFee,
    admissionDate,
    studentCode,
    phone,
    address,
    area,
    pincode,
    city,
    state,
    initialPaymentAmount,
    courseUpdateOnly,
  } = params;
  const addressLine = [address, area, city, state, pincode].filter(Boolean).join(", ");
  const appName = process.env.APP_NAME || "IVESDC";
  const courseAssigned = courseName && courseName !== "Not assigned yet";
  const title = courseUpdateOnly ? "Course Assigned" : "Student Account Created";
  const intro = courseUpdateOnly
    ? `Your course has been assigned at <strong>${escapeHtml(franchiseName)}</strong>. Below is your updated course and fee summary.`
    : `Your student registration is complete. Please save this email — it contains your login details${courseAssigned ? " and course / fee summary" : ""}. A course can be assigned by your institute if not already listed.`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} – ${escapeHtml(appName)}</title></head>
<body style="margin:0; padding:0; font-family: Georgia, 'Times New Roman', serif; background-color: #eef2f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f7; padding: 28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #d4dce8;">
        <tr><td style="background: #1E4A85; padding: 28px 32px; text-align: center;">
          <p style="margin: 0 0 6px; color: #C4A35A; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escapeHtml(appName)}</p>
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${escapeHtml(title)}</h1>
          <p style="margin: 10px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escapeHtml(franchiseName)}</p>
        </td></tr>
        <tr><td style="padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <p style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">Dear <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.65;">${intro}</p>

          <p style="margin: 0 0 10px; color: #1E4A85; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">Student details</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <tr><td style="padding: 18px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                ${studentCode ? `<tr><td style="padding: 7px 0; color: #64748b; width: 42%;">Student ID</td><td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${escapeHtml(studentCode)}</td></tr>` : ""}
                <tr><td style="padding: 7px 0; color: #64748b;">Full name</td><td style="padding: 7px 0; color: #0f172a; font-weight: 600;">${escapeHtml(fullName)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Email</td><td style="padding: 7px 0; color: #0f172a;">${escapeHtml(email)}</td></tr>
                ${phone ? `<tr><td style="padding: 7px 0; color: #64748b;">Phone</td><td style="padding: 7px 0; color: #0f172a;">${escapeHtml(phone)}</td></tr>` : ""}
                <tr><td style="padding: 7px 0; color: #64748b;">Franchise</td><td style="padding: 7px 0; color: #0f172a;">${escapeHtml(franchiseName)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Admission date</td><td style="padding: 7px 0; color: #0f172a;">${escapeHtml(admissionDate)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Course</td><td style="padding: 7px 0; color: #0f172a; font-weight: 600;">${escapeHtml(courseName)}</td></tr>
                ${addressLine ? `<tr><td style="padding: 7px 0; color: #64748b; vertical-align: top;">Address</td><td style="padding: 7px 0; color: #0f172a;">${escapeHtml(addressLine)}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>

          ${
            courseAssigned || totalFee > 0
              ? `<p style="margin: 0 0 10px; color: #1E4A85; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">Fee summary</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 20px;">
            <tr><td style="padding: 18px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                <tr><td style="padding: 7px 0; color: #64748b;">Total fee</td><td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${formatInr(totalFee)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Paid</td><td style="padding: 7px 0; color: #059669; font-weight: 600; text-align: right;">${formatInr(paidFee)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b; border-top: 1px solid #fde68a;">Pending</td><td style="padding: 7px 0; color: #b45309; font-weight: 700; text-align: right; border-top: 1px solid #fde68a;">${formatInr(pendingFee)}</td></tr>
              </table>
            </td></tr>
          </table>`
              : ""
          }

          ${
            !courseUpdateOnly && password
              ? `<p style="margin: 0 0 10px; color: #1E4A85; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">Login credentials</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f0f7ff; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 20px;">
            <tr><td style="padding: 18px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                <tr><td style="padding: 7px 0; color: #64748b;">Login URL</td><td style="padding: 7px 0;"><a href="${escapeHtml(loginUrl)}" style="color: #1E4A85;">${escapeHtml(loginUrl)}</a></td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Username (email)</td><td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Password</td><td style="padding: 7px 0; color: #0f172a; font-weight: 700; font-family: ui-monospace, monospace;">${escapeHtml(password)}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin: 0 0 20px; color: #94a3b8; font-size: 12px; line-height: 1.5;">Please change your password after first login. Do not share these credentials.</p>`
              : `<p style="margin: 0 0 20px; color: #94a3b8; font-size: 12px; line-height: 1.5;">Sign in with the credentials already shared with you.</p>`
          }
          <p style="margin: 0;"><a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 12px 28px; background: #1E4A85; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Sign in to student portal</a></p>
        </td></tr>
        <tr><td style="padding: 18px 32px; background: #1E4A85; color: rgba(255,255,255,0.75); font-size: 11px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${escapeHtml(appName)} · This is an automated message. Please do not reply.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Send welcome email to student with credentials and all details. */
export async function sendStudentWelcomeEmail(
  to: string,
  params: StudentWelcomeEmailParams
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { success: false, error: "SMTP not configured" };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const appName = process.env.APP_NAME || "IVESDC";
  const textParts = [
    `Dear ${params.fullName},`,
    "",
    params.courseUpdateOnly
      ? `Your course has been assigned at ${params.franchiseName}.`
      : `Your student account has been created at ${params.franchiseName}.`,
    params.studentCode ? `Student ID: ${params.studentCode}` : "",
    `Course: ${params.courseName}`,
    `Admission date: ${params.admissionDate}`,
    "",
    ...(!params.courseUpdateOnly && params.password
      ? [
          "Login:",
          `  Email: ${params.email}`,
          `  Password: ${params.password}`,
          `  URL: ${params.loginUrl}`,
          "",
        ]
      : []),
    `Total fee: ${formatInr(params.totalFee)}`,
    `Paid: ${formatInr(params.paidFee)}`,
    `Pending: ${formatInr(params.pendingFee)}`,
  ].filter(Boolean);
  if (params.address || params.area || params.city) {
    textParts.push("", `Address: ${[params.address, params.area, params.city, params.state, params.pincode].filter(Boolean).join(", ")}`);
  }
  if (!params.courseUpdateOnly) {
    textParts.push("", "Please change your password after first login.");
  }
  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: params.courseUpdateOnly
        ? `${appName} – Course assigned: ${params.courseName}${params.studentCode ? ` (${params.studentCode})` : ""}`
        : `${appName} – Student account created${params.studentCode ? ` (${params.studentCode})` : ""}`,
      html: getStudentWelcomeHtml(params),
      text: textParts.join("\n"),
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/** Fee payment receipt email params */
export interface FeeReceiptEmailParams {
  fullName: string;
  studentCode: string;
  email: string;
  franchiseName: string;
  courseName: string;
  receiptNo: string;
  paymentDate: string;
  amountPaid: number;
  paymentMode: string;
  transactionReference?: string | null;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
}

function getFeeReceiptHtml(params: FeeReceiptEmailParams): string {
  const {
    fullName,
    studentCode,
    franchiseName,
    courseName,
    receiptNo,
    paymentDate,
    amountPaid,
    paymentMode,
    transactionReference,
    totalFee,
    paidFee,
    pendingFee,
  } = params;
  const appName = process.env.APP_NAME || "IVESDC";
  const modeLabel = String(paymentMode || "CASH").replace(/_/g, " ");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Fee Receipt – ${escapeHtml(receiptNo)}</title></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #eef2f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f7; padding: 28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #d4dce8;">
        <tr><td style="background: #1E4A85; padding: 26px 32px; text-align: center;">
          <p style="margin: 0 0 6px; color: #C4A35A; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">${escapeHtml(appName)}</p>
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Fee Payment Receipt</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Receipt No. ${escapeHtml(receiptNo)}</p>
        </td></tr>
        <tr><td style="padding: 32px;">
          <p style="margin: 0 0 8px; color: #1e293b; font-size: 16px;">Dear <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.6;">Thank you. Your fee payment has been received successfully. Please keep this receipt for your records.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
            <tr><td style="padding: 20px 22px; text-align: center;">
              <p style="margin: 0 0 4px; color: #047857; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">Amount paid</p>
              <p style="margin: 0; color: #065f46; font-size: 28px; font-weight: 800;">${formatInr(amountPaid)}</p>
              <p style="margin: 8px 0 0; color: #059669; font-size: 13px;">${escapeHtml(modeLabel)}${transactionReference ? ` · Ref: ${escapeHtml(transactionReference)}` : ""}</p>
            </td></tr>
          </table>

          <p style="margin: 0 0 10px; color: #1E4A85; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">Receipt details</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <tr><td style="padding: 18px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                <tr><td style="padding: 7px 0; color: #64748b;">Receipt No.</td><td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(receiptNo)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Payment date</td><td style="padding: 7px 0; color: #0f172a; text-align: right;">${escapeHtml(paymentDate)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Student ID</td><td style="padding: 7px 0; color: #0f172a; text-align: right;">${escapeHtml(studentCode)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Student name</td><td style="padding: 7px 0; color: #0f172a; text-align: right;">${escapeHtml(fullName)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Franchise</td><td style="padding: 7px 0; color: #0f172a; text-align: right;">${escapeHtml(franchiseName)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Course</td><td style="padding: 7px 0; color: #0f172a; text-align: right;">${escapeHtml(courseName)}</td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin: 0 0 10px; color: #1E4A85; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">Fee balance</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
            <tr><td style="padding: 18px 22px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                <tr><td style="padding: 7px 0; color: #64748b;">Total fee</td><td style="padding: 7px 0; color: #0f172a; font-weight: 600; text-align: right;">${formatInr(totalFee)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b;">Total paid (incl. this payment)</td><td style="padding: 7px 0; color: #059669; font-weight: 600; text-align: right;">${formatInr(paidFee)}</td></tr>
                <tr><td style="padding: 7px 0; color: #64748b; border-top: 1px solid #fde68a;">Pending fee</td><td style="padding: 7px 0; color: #b45309; font-weight: 800; text-align: right; border-top: 1px solid #fde68a;">${formatInr(pendingFee)}</td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">This is a computer-generated receipt from ${escapeHtml(franchiseName)}. For queries, contact your institute.</p>
        </td></tr>
        <tr><td style="padding: 18px 32px; background: #1E4A85; color: rgba(255,255,255,0.75); font-size: 11px; text-align: center;">
          ${escapeHtml(appName)} · Automated fee receipt — please do not reply.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Send fee payment receipt to student email. */
export async function sendFeeReceiptEmail(
  to: string,
  params: FeeReceiptEmailParams
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { success: false, error: "SMTP not configured" };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const appName = process.env.APP_NAME || "IVESDC";
  const text = [
    `Dear ${params.fullName},`,
    "",
    "Fee payment receipt",
    `Receipt No.: ${params.receiptNo}`,
    `Date: ${params.paymentDate}`,
    `Student ID: ${params.studentCode}`,
    `Course: ${params.courseName}`,
    `Franchise: ${params.franchiseName}`,
    "",
    `Amount paid: ${formatInr(params.amountPaid)}`,
    `Mode: ${params.paymentMode}`,
    params.transactionReference ? `Reference: ${params.transactionReference}` : "",
    "",
    `Total fee: ${formatInr(params.totalFee)}`,
    `Total paid: ${formatInr(params.paidFee)}`,
    `Pending: ${formatInr(params.pendingFee)}`,
    "",
    "This is a computer-generated receipt.",
  ]
    .filter(Boolean)
    .join("\n");
  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `${appName} – Fee receipt ${params.receiptNo} (${formatInr(params.amountPaid)})`,
      html: getFeeReceiptHtml(params),
      text,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/** Send course enquiry notification to super admin (and optionally confirmation to user). Uses SMTP. */
export async function sendEnrollmentNotification(
  params: EnrollmentNotificationParams
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured" };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const appName = process.env.APP_NAME || "Franchise Institute";
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!adminEmail) {
    return { success: false, error: "ADMIN_EMAIL or SMTP_FROM not set" };
  }
  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to: adminEmail,
      subject: `[${appName}] New course enquiry – ${params.fullName} (${params.courseName})`,
      html: getEnrollmentNotificationHtml(params),
      text: `New course enquiry\n\nName: ${params.fullName}\nEmail: ${params.email}\nPhone: ${params.phone}\nCourse(s): ${params.courseName}\n${params.address || params.pincode || params.area || params.city || params.state ? `Address: ${[params.address, [params.area, params.city, params.state].filter(Boolean).join(", "), params.pincode].filter(Boolean).join(" · ")}\n` : ""}${params.message ? `Message: ${params.message}\n` : ""}`,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
