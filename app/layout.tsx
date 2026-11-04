import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "MBA OS — The MBA Aspirant's Companion",
  description: "A focused workspace for MBA entrance preparation: PYQs, mock tests, concept notes and performance intelligence.",
  applicationName: "MBA OS",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="mba-paper"><body className={sans.variable}><SiteHeader />{children}<Toaster position="bottom-right" richColors closeButton /></body></html>;
}