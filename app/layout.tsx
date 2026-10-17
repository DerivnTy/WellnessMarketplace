import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./trust.css";
import "./cart.css";
import "./trust-depth.css";
import "./motion.css";
import "./departments.css";
import "./mobile.css";
import "./product-interactions.css";
import "./research-shopping.css";
import "./listing.css";

export const viewport: Viewport = {width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff"};

export const metadata: Metadata = {
  metadataBase: new URL("https://wellness-marketplace-tn.poeticfawn64.chatgpt.site"),
  openGraph: {
    type: "website",
    siteName: "Wellness Marketplace",
    title: "Wellness Marketplace",
    description: "Better choices, all in one place. Discover brands, compare products, and shop with clarity.",
    images: [{url: "/wellness-marketplace-share.png", width: 1200, height: 630, type: "image/png", alt: "Wellness Marketplace logo"}],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wellness Marketplace",
    description: "Better choices, all in one place.",
    images: ["/wellness-marketplace-share.png"],
  },
  title: "Wellness Marketplace",
  description: "Better choices, all in one place. Discover wellness products with a clearer view of ingredients, materials and community research.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
