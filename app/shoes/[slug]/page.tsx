import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import ProductDetails from "./ProductDetails";
import SiteHeader from "../../SiteHeader";


async function Details({ params }: { params: Promise<{ slug: string }> }) {
  await connection();

  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, description, price, sizes, images, stock")
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
        <Link href="/" className="underline">
          ← All shoes
        </Link>
        <div className="mt-4">
          <ProductDetails product={product} />
        </div>
      </section>
    </main>
  );
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