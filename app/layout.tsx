import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "MBA OS — The MBA Aspirant's Companion",
  description: "A focused workspace for MBA entrance preparation: PYQs, mock tests, concept notes and performance intelligence.",
  applicationName: "MBA OS",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="mba-paper"><body className={display.variable + " " + sans.variable + " " + mono.variable}>{children}<Toaster position="bottom-right" richColors closeButton /></body></html>;
}