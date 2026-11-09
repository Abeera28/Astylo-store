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

export const metadata: Metadata = {
  metadataBase: safeSiteUrl(),
  title: {
    default: "Astylo Shoes | Ladies Shoes & Heels Collection",
    template: "%s | Astylo Shoes",
  },
  description:
    "Astylo Shoes: ladies heels, flats and sandals. Choose your size and order online with Cash on Delivery.",
  applicationName: "Astylo Shoes",
  openGraph: {
    siteName: "Astylo Shoes",
    type: "website",
    locale: "en_PK",
  },
};

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