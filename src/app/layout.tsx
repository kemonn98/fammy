import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { SerwistRegister } from "@/components/serwist-register";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fammy",
  description: "Todo & agenda for couples",
  applicationName: "Fammy",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fammy",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
    <html lang="en" className={cn("dark h-full", inter.variable, "font-sans", geist.variable)}>
      <body
        suppressHydrationWarning
        className="min-h-full bg-background font-sans text-foreground antialiased"
      >
        <Providers>
          {children}
          <SerwistRegister />
        </Providers>
      </body>
    </html>
  );
}
