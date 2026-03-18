# SMTP Configuration (Franchise Credentials Email)

When a **SUPER_ADMIN** creates a new franchise with **owner details** (ownerEmail, ownerName), the system:

1. Creates the franchise owner user (SUB_ADMIN) with a generated password.
2. Creates the franchise and links the owner.
3. Sends an HTML email with login credentials via Nodemailer.

Add these to your `.env`:

```env
# SMTP (e.g. Gmail, SendGrid, or your SMTP server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# App URL (used in email login link)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
APP_NAME=Franchise Institute
```

- **Gmail**: Use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password.
- **SendGrid / others**: Use their SMTP host and credentials.

If SMTP is not set, franchise creation still succeeds; the API response includes `emailSent: false` and `emailError: "SMTP not configured"`.
