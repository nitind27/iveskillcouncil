import nodemailer from "nodemailer";

export interface FranchiseCredentialsEmailParams {
  franchiseName: string;
  loginUrl: string;
  email: string;
  password: string;
  planName: string;
  ownerName: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
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
  const { franchiseName, loginUrl, email, password, planName, ownerName } = params;
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
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">Your franchise <strong>${escapeHtml(franchiseName)}</strong> has been registered. Use the credentials below to sign in.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Franchise</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(franchiseName)}</td></tr>
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subscription Plan</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(planName)}</td></tr>
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Login URL</td><td style="padding: 6px 0;"><a href="${escapeHtml(loginUrl)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(loginUrl)}</a></td></tr>
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Username (Email)</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(email)}</td></tr>
                      <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Password</td><td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; font-family: monospace;">${escapeHtml(password)}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px;">Please change your password after first login. Keep these credentials secure.</p>
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
  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `Your ${appName} login credentials – ${params.franchiseName}`,
      html: getFranchiseCredentialsHtml(params),
      text: `Hello ${params.ownerName},\n\nYour franchise ${params.franchiseName} has been registered.\nLogin URL: ${params.loginUrl}\nUsername: ${params.email}\nPassword: ${params.password}\nPlan: ${params.planName}\n\nPlease change your password after first login.`,
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
