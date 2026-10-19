"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteFooter from "./SiteFooter";

export default function ShopFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // admin pages and the home page keep their own layout
  if (pathname.startsWith("/admin") || pathname === "/") {
    return <>{children}</>;
  }

  const segment = pathname.split("/")[1] ?? "";
  const page = segment === "order" ? "order-confirmed" : segment;

  return (
    <div className="shop-frame" data-page={page}>
      <div className="topbar">Cash on Delivery available on every order</div>
      {children}
      <SiteFooter />
    </div>
  );
}