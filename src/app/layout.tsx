import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { publicImage } from "@/lib/images";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "NC Risk Radar — Know What's Nearby. Know What's Coming.", template: "%s · NC Risk Radar" },
  description: "Property, safety, development, and government alerts for North Carolina. Check an address for reported crime activity, official registered-offender resources, development proposals, road projects, environmental records, and government decisions.",
  robots: process.env.APP_URL?.includes("staging") ? { index: false, follow: false } : undefined,
  openGraph: { type: "website", siteName: "NC Risk Radar", ...(publicImage("og-card.jpg") ? { images: [{ url: "/images/og-card.jpg", width: 1200, height: 630, alt: "NC Risk Radar — Know What's Nearby. Know What's Coming." }] } : {}) },
  twitter: { card: publicImage("og-card.jpg") ? "summary_large_image" : "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-card focus:px-3 focus:py-2 focus:rounded">Skip to main content</a>
        <SiteHeader />
        <main id="main" className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
