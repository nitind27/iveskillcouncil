import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppShell from "@/components/AppShell";
import ToastProvider from "@/components/common/ToastProvider";
import SWRProvider from "@/components/SWRProvider";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-devanagari",
  weight: ["400", "500", "600", "700"],
});
const notoGujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  display: "swap",
  variable: "--font-gujarati",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IVESDC",
  description: "Comprehensive franchise management system with multi-role support, subscription plans, and advanced features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoDevanagari.variable} ${notoGujarati.variable} ${inter.className} font-sans antialiased`}
      >
        <ToastProvider />
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <SWRProvider>
                <AppShell>{children}</AppShell>
              </SWRProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

