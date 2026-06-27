import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { SerwistRegister } from "@/components/serwist-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fammy",
  description: "Todo & agenda untuk pasangan",
  applicationName: "Fammy",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fammy",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#5b8a72",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body
        suppressHydrationWarning
        className="min-h-full bg-[var(--background)] font-sans text-stone-900 antialiased"
      >
        <Providers>
          {children}
          <SerwistRegister />
        </Providers>
      </body>
    </html>
  );
}
