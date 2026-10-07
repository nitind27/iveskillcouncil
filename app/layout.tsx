import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppShell from "@/components/AppShell";
import ToastProvider from "@/components/common/ToastProvider";
import { ConfirmDialogHost } from "@/components/common/ConfirmDialog";
import SWRProvider from "@/components/SWRProvider";
import GlobalLoader from "@/components/common/GlobalLoader";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
});
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
  metadataBase: new URL(getSiteUrl()),
  title: "Best Computer Course in Tapi | IVESDC Eklavya Education Hub Songadh",
  description:
    "Yashvant Prajapati, owner of IVESDC, runs Eklavya Education Hub in Songadh, Tapi. Join the best computer course in Songadh — practical computer training and skill development.",
  applicationName: "IVESDC",
  verification: {
    google: "sBvhwP4AiD0KQUF5R8x2uFFZSn_dajTcyUZ1HtqlWy4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jakarta.variable} ${notoDevanagari.variable} ${notoGujarati.variable} ${inter.className} font-sans antialiased`}
      >
        <GlobalLoader />
        <ToastProvider />
        <ConfirmDialogHost />
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

