import { Suspense, type ReactElement } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "../lib/supabase/server";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import type { Metadata } from "next";

async function HeroArt() {
  await connection();

  const supabase = await createClient();
  const { data } = await supabase
    .from("shop_info")
    .select("hero_image_url")
    .eq("id", 1)
    .maybeSingle();

  const url = data?.hero_image_url;

  if (!url) {
    return <div className="hero-art hero-art-empty" />;
  }

  return (
    <a href="#shoes" className="hero-art">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Astylo new collection" fetchPriority="high" />
    </a>
  );
}

async function ProductGrid() {
  await connection();

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, images, stock")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border rounded-2xl p-12 text-center">
        <p className="font-serif text-2xl">Coming soon</p>
        <p className="text-gray-600 mt-1">New shoes are on the way.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((p) => {
        const soldOut = p.stock <= 0;

        return (
          <Link key={p.id} href={`/shoes/${p.slug}`} className="product-card block">
            <div className="product-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images?.[0]}
loading="lazy"
decoding="async"
                alt={p.name}
                className={`w-full h-full object-cover ${
                  soldOut ? "grayscale opacity-60" : ""
                }`}
              />
              {soldOut && <span className="badge badge-dark">Sold out</span>}
              {!soldOut && p.stock <= 3 && (
                <span className="badge badge-accent">Only {p.stock} left</span>
              )}
            </div>
            <div className="p-3 md:p-4">
              <p className="font-medium leading-snug">{p.name}</p>
              <p className="price mt-1">
                Rs. {Number(p.price).toLocaleString("en-US")}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const SVG_PROPS = {
  width: 30,
  height: 30,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, ReactElement> = {
  truck: (
    <svg {...SVG_PROPS} aria-hidden="true">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  ),
  shield: (
    <svg {...SVG_PROPS} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  ),
  support: (
    <svg {...SVG_PROPS} aria-hidden="true">
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
      <rect x="3.5" y="13" width="3.5" height="5" rx="1.5" />
      <rect x="17" y="13" width="3.5" height="5" rx="1.5" />
      <path d="M19 18c0 2-2 3-5 3" />
    </svg>
  ),
};

const TRUST = [
  ["truck", "Cash on Delivery", "Pay when your shoes arrive"],
  ["shield", "Easy checkout", "Order in a few taps"],
  ["support", "Track your order", "See every step in My orders"],
];

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Astylo Shoes",
      alternateName: ["Astylo", "Astylo Shoes Collection"],
      url: `${SITE_URL}/`,
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Astylo Shoes",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.svg`,
    },
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen">
            <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c"),
        }}
      />
      <div className="topbar">Cash on Delivery available on every order</div>
      <SiteHeader />

      <section className="page-wrap pt-4 md:pt-8">
        <div className="hero">
          <div className="grid grid-cols-[1.25fr_1fr] items-center gap-3 px-4 py-5 md:grid-cols-2 md:gap-8 md:px-14 md:py-16">
            <div>
              <p className="eyebrow mb-2 md:mb-4">New collection</p>
              <h1 className="hero-title">
                Elegance in <em>every step.</em>
              </h1>
              <p className="mt-5 hidden max-w-md text-gray-700 md:block">
                Heels and flats made to be noticed. Choose your size, add to
                cart, and order in a few taps.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-8">
                <a href="#shoes" className="btn-solid">
                  Shop the collection
                </a>
                <Link href="/orders" className="btn-outline hidden md:inline-flex">
                  Track my order
                </Link>
              </div>
            </div>

            <Suspense fallback={<div className="hero-art hero-art-empty" />}>
              <HeroArt />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="page-wrap mt-6 hidden md:block">
        <div className="trust grid gap-4 p-5 sm:grid-cols-3">
          {TRUST.map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-3">
             <span className="trust-icon">{ICONS[icon]}</span>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="shoes" className="page-wrap scroll-mt-20 py-8 md:scroll-mt-24 md:py-14">
        <p className="eyebrow mb-1 md:mb-2">Our collection</p>
        <h2 className="mb-4 text-2xl md:mb-8 md:text-5xl">Shop all shoes</h2>
        <Suspense fallback={<p className="text-gray-600">Loading shoes...</p>}>
          <ProductGrid />
        </Suspense>
      </section>

      <SiteFooter />
    </main>
  );
}