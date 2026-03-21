import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOtpEmail(
  to: string,
  params: { otp: string; userName: string; purpose: string }
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const appName = process.env.APP_NAME || "Franchise Institute";

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `Your OTP for ${params.purpose} – ${appName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <p>Hello ${params.userName},</p>
          <p>Your OTP for ${params.purpose} is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${params.otp}</p>
          <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
      text: `Your OTP: ${params.otp}. Valid for 10 minutes.`,
    });
    return true;
  } catch {
    return false;
  }
}
