import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - IVESDC",
  description: "Sign in to access your account",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
