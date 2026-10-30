"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { useCart } from "../lib/cart";
import PageNav from "./PageNav";

const BANNERS: Record<string, { eyebrow: string; title: string; text: string }> = {
  orders: {
    eyebrow: "Your account",
    title: "My orders",
    text: "Track everything you have ordered.",
  },
  cart: {
    eyebrow: "Shopping bag",
    title: "Your cart",
    text: "Review your shoes before checkout.",
  },
  checkout: {
    eyebrow: "Almost there",
    title: "Checkout",
    text: "A few details and your shoes are on the way.",
  },
  login: {
    eyebrow: "Welcome",
    title: "Log in or sign up",
    text: "Create an account to place your order.",
  },
  order: {
    eyebrow: "Order confirmed",
    title: "Order placed",
    text: "Thank you for shopping with Astylo.",
  },
};

export default function SiteHeader() {
    const { count: cartCount, ready } = useCart();
  const count = ready ? cartCount : 0;
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  const banner = BANNERS[pathname.split("/")[1] ?? ""];

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="site-header sticky top-0 z-30">
        <div className="header-inner">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            Astylo<span className="brand-dot" />
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden md:flex items-center gap-7">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/#shoes" className="nav-link">
                Shop
              </Link>
              {loggedIn === true && (
                <>
                  <Link href="/orders" className="nav-link">
                    My orders
                  </Link>
                  <button type="button" onClick={handleLogout} className="nav-link">
                    Log out
                  </button>
                </>
              )}
              {loggedIn === false && (
                <Link href="/login" className="nav-link">
                  Log in
                </Link>
              )}
            </nav>

            <Link
              href="/cart"
              className="cart-btn"
              aria-label="Cart"
              onClick={() => setOpen(false)}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 7h12l1 13H5L6 7z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              <span className={`cart-count ${count === 0 ? "is-empty" : ""}`}>
                {count}
              </span>
            </Link>

            <button
              type="button"
              className="menu-btn md:hidden"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t bg-[#faf6f2]">
            <nav className="page-wrap flex flex-col py-2">
              <Link href="/" className="mobile-link" onClick={() => setOpen(false)}>
                Home
              </Link>
              <Link
                href="/#shoes"
                className="mobile-link"
                onClick={() => setOpen(false)}
              >
                Shop
              </Link>
              {loggedIn === true && (
                <>
                  <Link
                    href="/orders"
                    className="mobile-link"
                    onClick={() => setOpen(false)}
                  >
                    My orders
                  </Link>
                  <button
                    type="button"
                    className="mobile-link text-left"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              )}
              {loggedIn === false && (
                <Link
                  href="/login"
                  className="mobile-link"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {banner && (
        <div className="page-banner">
          <div className="page-wrap py-8 md:py-12 text-center">
            <p className="eyebrow">{banner.eyebrow}</p>
            <h1 className="page-banner-title mt-2">{banner.title}</h1>
            <p className="mt-2 text-sm md:text-base text-gray-600">{banner.text}</p>
          </div>
        </div>
      )}
     <PageNav wrap />
    </>
  );
}