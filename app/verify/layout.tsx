import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Certificate / Marksheet — IVESDC",
  description:
    "Scan the QR code on an IVESDC certificate or statement of marks to verify authenticity.",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
