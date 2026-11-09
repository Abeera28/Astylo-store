import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../lib/cart";
import ShopFrame from "./ShopFrame";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

function safeSiteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://astyloshoes.netlify.app"), // change to your custom domain later
  title: {
    default: "Astylo Shoes | Ladies Heels, Flats & Collection",
    template: "%s | Astylo Shoes",
  },
  description:
    "Astylo Shoes – ladies shoes, heels and flats made to be noticed. Browse the collection, choose your size and order in a few taps.",
  applicationName: "Astylo Shoes",
  openGraph: {
    title: "Astylo Shoes",
    description: "Ladies heels and flats collection. Order online.",
    siteName: "Astylo Shoes",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Astylo Shoes",
    alternateName: "Astylo Shoes & Collection Inn",
    url: "https://astyloshoes.netlify.app",
    logo: "https://astyloshoes.netlify.app/logo.png", // PNG, at least 112x112
    sameAs: [
      // add your Facebook / Instagram links here
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${playfair.variable}`}
    >
      <body>
        <CartProvider>
          <Suspense fallback={null}>
            <ShopFrame>{children}</ShopFrame>
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}