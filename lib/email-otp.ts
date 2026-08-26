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
    secure: port === 465 || process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function buildOtpHtml(params: {
  otp: string;
  userName: string;
  purpose: string;
  appName: string;
}) {
  const { otp, userName, purpose, appName } = params;
  const digits = otp.split("").map(
    (d) =>
      `<td style="width:40px;height:48px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC;text-align:center;font-size:22px;font-weight:800;color:#1E4A85;letter-spacing:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${d}</td>`
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>OTP – ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EEF2F7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:440px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
          <tr>
            <td style="background:linear-gradient(135deg,#1E4A85 0%,#163A6B 100%);padding:22px 24px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#E8D5A3;">
                ${appName}
              </p>
              <h1 style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;line-height:1.3;color:#ffffff;font-weight:800;">
                Login verification code
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:#1A1A1A;">
                Hello ${userName || "Admin"},
              </p>
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.55;color:#4B5563;">
                Use this one-time password to complete your <strong style="color:#1E4A85;">${purpose}</strong>. Enter it on the login screen.
              </p>
              <table role="presentation" cellspacing="6" cellpadding="0" align="center" style="margin:0 auto 8px;">
                <tr>${digits.join("")}</tr>
              </table>
              <p style="margin:16px 0 0;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:28px;font-weight:800;letter-spacing:10px;color:#1E4A85;">
                ${otp}
              </p>
              <p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.5;color:#6B7280;text-align:center;">
                Valid for <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 20px;border-top:1px solid #F3F4F6;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#9CA3AF;text-align:center;">
                If you did not request this, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(
  to: string,
  params: { otp: string; userName: string; purpose: string }
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("SMTP not configured — cannot send OTP");
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";
  const appName = process.env.APP_NAME || "IVESDC";

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject: `${params.otp} is your ${appName} login OTP`,
      html: buildOtpHtml({
        otp: params.otp,
        userName: params.userName,
        purpose: params.purpose,
        appName,
      }),
      text: `${appName} login OTP\n\nHello ${params.userName},\n\nYour OTP for ${params.purpose} is: ${params.otp}\n\nValid for 10 minutes. Do not share it.\n`,
    });
    return true;
  } catch (err) {
    console.error("sendOtpEmail failed:", err);
    return false;
  }
}
