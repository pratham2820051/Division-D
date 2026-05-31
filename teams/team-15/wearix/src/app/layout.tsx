import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import ChatWidget from "@/components/common/ChatWidget";

// Using global CSS @import for Inter (avoid next/font Turbopack issues)

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Wearix – Modern Fashion",
    template: "%s | Wearix",
  },
  description:
    "Discover premium fashion for every occasion. Shop men's, women's, and children's clothing at Wearix — where style meets simplicity.",
  keywords: ["fashion", "clothing", "men", "women", "children", "wearix", "style", "modern"],
  authors: [{ name: "Wearix Team" }],
  creator: "Wearix",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wearix.com",
    siteName: "Wearix",
    title: "Wearix – Modern Fashion",
    description:
      "Discover premium fashion for every occasion. Shop men's, women's, and children's clothing at Wearix.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wearix – Modern Fashion",
    description:
      "Discover premium fashion for every occasion. Shop men's, women's, and children's clothing at Wearix.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className="h-full">
        <body className="antialiased bg-white text-[#1A1A1A] min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {/* Sticky top navigation */}
            <Navbar />

            {/* Page content */}
            <main className="flex-1">{children}</main>

            {/* Site footer */}
            <Footer />

            {/* Persistent floating chat widget */}
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
