import type { Metadata } from "next";
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
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astylo",
  description: "Astylo ladies shoes and heels",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>
          <ShopFrame>{children}</ShopFrame>
        </CartProvider>
      </body>
    </html>
  );
}