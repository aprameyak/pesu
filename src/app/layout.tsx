import type { Metadata, Viewport } from "next";
import { Sora, Nunito_Sans, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Pesu — Speak conversational Tamil",
  description:
    "Learn to understand and speak everyday Tamil using Romanized Tamil first. Tamil script stays secondary. No alphabet gatekeeping.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${nunito.variable} ${notoTamil.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-atmosphere text-ink">{children}</body>
    </html>
  );
}
