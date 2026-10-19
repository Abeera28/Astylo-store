"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = { label: string; href?: string };

type Config = { backHref: string; backLabel: string; crumbs: Crumb[] };

const ROUTES: Record<string, Config> = {
  orders: {
    backHref: "/",
    backLabel: "Back to shop",
    crumbs: [{ label: "Home", href: "/" }, { label: "My orders" }],
  },
  cart: {
    backHref: "/#shoes",
    backLabel: "Continue shopping",
    crumbs: [{ label: "Home", href: "/" }, { label: "Cart" }],
  },
  checkout: {
    backHref: "/cart",
    backLabel: "Back to cart",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Cart", href: "/cart" },
      { label: "Checkout" },
    ],
  },
  login: {
    backHref: "/",
    backLabel: "Back to shop",
    crumbs: [{ label: "Home", href: "/" }, { label: "Log in" }],
  },
  order: {
    backHref: "/orders",
    backLabel: "My orders",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "My orders", href: "/orders" },
      { label: "Order placed" },
    ],
  },
};

export default function PageNav({
  backHref,
  backLabel,
  crumbs,
  wrap,
}: {
  backHref?: string;
  backLabel?: string;
  crumbs?: Crumb[];
  wrap?: boolean;
}) {
  const pathname = usePathname();
  const auto = ROUTES[pathname.split("/")[1] ?? ""];

  const config: Config | undefined =
    backHref && backLabel && crumbs ? { backHref, backLabel, crumbs } : auto;

  if (!config) return null;

  const nav = (
    <nav className="page-nav" aria-label="Page navigation">
      <Link href={config.backHref} className="back-pill">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        {config.backLabel}
      </Link>

      <ol className="crumbs" aria-label="Breadcrumb">
        {config.crumbs.map((crumb, i) => {
          const last = i === config.crumbs.length - 1;
          return (
            <li key={crumb.label} className={last ? "is-current" : ""}>
              {crumb.href && !last ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return wrap ? <div className="page-wrap pt-4">{nav}</div> : nav;
}