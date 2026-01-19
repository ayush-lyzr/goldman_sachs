import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Goldman Sachs | Investment Guidelines Management",
    template: "%s | Goldman Sachs",
  },
  description: "Goldman Sachs Investment Guidelines Management Platform - Enterprise-grade mandate compliance and portfolio oversight",
  keywords: ["Goldman Sachs", "Investment Management", "Portfolio Management", "Compliance", "Guidelines"],
  authors: [{ name: "Goldman Sachs" }],
  creator: "Goldman Sachs",
  publisher: "Goldman Sachs",
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    title: "Goldman Sachs | Investment Guidelines Management",
    description: "Enterprise-grade mandate compliance and portfolio oversight",
    siteName: "Goldman Sachs Investment Management",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Premium font: Instrument Serif for display text */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
