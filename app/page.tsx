import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "../lib/supabase/server";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

async function HeroArt() {
  await connection();

  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("products")
    .select("name, slug, price, images")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest?.images?.[0]) {
    return <div className="hero-art hero-art-empty" />;
  }

  return (
    <Link href={`/shoes/${latest.slug}`} className="hero-art">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={latest.images[0]} alt={latest.name} />
      <div className="hero-tag">
        <p className="eyebrow">Just in</p>
        <p className="font-serif text-lg leading-tight">{latest.name}</p>
        <p className="price text-sm">
          Rs. {Number(latest.price).toLocaleString()}
        </p>
      </div>
    </Link>
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
              <p className="price mt-1">Rs. {Number(p.price).toLocaleString()}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const TRUST = [
  ["✓", "Cash on Delivery", "Pay when your shoes arrive"],
  ["✓", "Easy checkout", "Order in a few taps"],
  ["✓", "Track your order", "See every step in My orders"],
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="topbar">Cash on Delivery available on every order</div>
      <SiteHeader />

      <section className="page-wrap pt-6 md:pt-8">
        <div className="hero">
          <div className="grid md:grid-cols-2 items-center gap-8 px-6 py-10 md:px-14 md:py-16">
            <div>
              <p className="eyebrow mb-4">New collection</p>
              <h1 className="hero-title">
                Elegance in <em>every step.</em>
              </h1>
              <p className="mt-5 max-w-md text-gray-700">
                Heels and flats made to be noticed. Choose your size, add to
                cart, and order in a few taps.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#shoes" className="btn-solid">
                  Shop the collection
                </a>
                <Link href="/orders" className="btn-outline">
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

      <section className="page-wrap mt-6">
        <div className="trust grid sm:grid-cols-3 gap-4 p-5">
          {TRUST.map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="trust-icon">{icon}</span>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="shoes" className="page-wrap py-14 scroll-mt-24">
        <p className="eyebrow mb-2">Our collection</p>
        <h2 className="text-3xl md:text-5xl mb-8">Shop all shoes</h2>
        <Suspense fallback={<p className="text-gray-600">Loading shoes...</p>}>
          <ProductGrid />
        </Suspense>
      </section>
       <SiteFooter />

      
  
    </main>
  );
}