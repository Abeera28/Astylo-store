import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";
import ProductDetails from "./ProductDetails";
import SiteHeader from "../../SiteHeader";
import PageNav from "../../PageNav";

async function Details({ params }: { params: Promise<{ slug: string }> }) {
  await connection();

  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, sizes, images, stock, colors, unavailable_colors"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  // other shoes, newest first (not the one being viewed)
  const { data: others } = await supabase
    .from("products")
    .select("id, name, slug, price, images, stock")
    .eq("is_active", true)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="p-6 max-w-5xl mx-auto">
        <PageNav
          backHref="/#shoes"
          backLabel="Back to shoes"
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Shoes", href: "/#shoes" },
            { label: product.name },
          ]}
        />
        <div className="mt-4">
          <ProductDetails product={product} />
        </div>
      </section>

      {others && others.length > 0 && (
        <section className="page-wrap pt-6 pb-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">More to love</p>
              <h2 className="text-2xl md:text-4xl">You may also like</h2>
            </div>
            <Link href="/#shoes" className="btn-outline">
              View all shoes
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {others.map((p) => {
              const soldOut = p.stock <= 0;

              return (
                <Link
                  key={p.id}
                  href={`/shoes/${p.slug}`}
                  className="product-card block"
                >
                  <div className="product-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                     src={p.images?.[0] ?? ""}
loading="lazy"
decoding="async"
                      alt={p.name}
                      className={`w-full h-full object-cover ${
                        soldOut ? "grayscale opacity-60" : ""
                      }`}
                    />
                    {soldOut && (
                      <span className="badge badge-dark">Sold out</span>
                    )}
                    {!soldOut && p.stock <= 3 && (
                      <span className="badge badge-accent">
                        Only {p.stock} left
                      </span>
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
        </section>
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // public client: the shoes are public, so no login is needed here
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, images")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    return { title: "Shoe not found | Astylo" };
  }

  const image = product.images?.[0];
  const price = `Rs. ${Number(product.price).toLocaleString("en-US")}`;
  const raw = (product.description ?? "").replace(/\s+/g, " ").trim();
  const description = raw
    ? raw.length > 160
      ? raw.slice(0, 157) + "..."
      : raw
    : "Ladies shoes and heels from Astylo.";
  const title = `${product.name} - ${price}`;

  return {
    title: `${product.name} | Astylo`,
    description,
    alternates: { canonical: `/shoes/${slug}` },
    openGraph: {
      title,
      description,
      url: `/shoes/${slug}`,
      siteName: "Astylo",
      type: "website",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ShoePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      }
    >
      <Details params={params} />
    </Suspense>
  );
}