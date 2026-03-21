import PDFDocument from "pdfkit";

export interface FranchiseCredentialsPdfParams {
  franchiseName: string;
  franchiseId: string;
  ownerName: string;
  email: string;
  password?: string;
  phone?: string | null;
  planName: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  loginUrl: string;
  appName?: string;
}

/** Generate PDF buffer with franchise credentials. */
export async function generateFranchiseCredentialsPdf(
  params: FranchiseCredentialsPdfParams
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const appName = params.appName || "Franchise Institute";

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text(`${appName}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica").text("Franchise Admin Credentials", { align: "center" });
    doc.moveDown(2);

    // Section: Login Credentials
    doc.fontSize(16).font("Helvetica-Bold").text("Login Credentials", { underline: true });
    doc.moveDown(1);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Username (Email):  ${params.email}`);
    if (params.password) doc.text(`Password:          ${params.password}`);
    doc.text(`Login URL:         ${params.loginUrl}`);
    if (!params.password) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#059669");
      doc.text("First-time setup: Visit login page → Enter email → Receive OTP → Verify → Set password.");
    }
    doc.moveDown(1.5);

    // Section: Franchise Details
    doc.fontSize(16).font("Helvetica-Bold").text("Franchise Details", { underline: true });
    doc.moveDown(1);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Franchise Name:    ${params.franchiseName}`);
    doc.text(`Franchise ID:      ${params.franchiseId}`);
    doc.text(`Owner Name:       ${params.ownerName}`);
    doc.text(`Subscription Plan: ${params.planName}`);
    doc.text(`Start Date:        ${params.subscriptionStart}`);
    doc.text(`End Date:          ${params.subscriptionEnd}`);
    if (params.phone) doc.text(`Phone:             ${params.phone}`);
    doc.moveDown(1.5);

    // Section: Address (if any)
    const addressParts = [params.address, params.city, params.state, params.pincode].filter(Boolean);
    if (addressParts.length > 0) {
      doc.fontSize(16).font("Helvetica-Bold").text("Address", { underline: true });
      doc.moveDown(1);
      doc.fontSize(11).font("Helvetica").text(addressParts.join(", "));
      doc.moveDown(1.5);
    }

    // Footer note
    doc.fontSize(10).fillColor("#666666");
    doc.text("Please change your password after first login. Keep this document secure.", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc.text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });

    doc.end();
  });
}
