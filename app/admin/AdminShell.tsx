"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Shoes" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Payments" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin" || pathname.startsWith("/admin/products");
    }
    return pathname.startsWith(href);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <Link href="/admin" className="admin-brand">
            Astylo <span>Admin</span>
          </Link>

          <nav className="admin-nav">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`admin-link ${isActive(link.href) ? "is-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="admin-actions">
            <Link href="/" target="_blank" className="admin-link">
              View shop ↗
            </Link>
            <button type="button" onClick={signOut} className="admin-signout">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">{children}</div>
    </div>
  );
}