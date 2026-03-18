import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminLayout from "@/components/adminpanel/AdminLayout";
import ToastProvider from "@/components/common/ToastProvider";
import SWRProvider from "@/components/SWRProvider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Franchise Institute Management System",
  description: "Comprehensive franchise management system with multi-role support, subscription plans, and advanced features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider />
        <ThemeProvider>
          <AuthProvider>
            <SWRProvider>
              <AdminLayout>{children}</AdminLayout>
            </SWRProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

