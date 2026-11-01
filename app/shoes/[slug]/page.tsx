import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { connection } from "next/server";
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