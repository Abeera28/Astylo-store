import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import ProductForm from "../../new/ProductForm";

async function Guard({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    redirect("/admin");
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, slug, name, description, price, sizes, images, stock")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen p-6">
      <Link href="/admin" className="underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold my-4">Edit shoe</h1>
      <ProductForm
        product={{
          ...product,
          price: Number(product.price),
        }}
      />
    </main>
  );
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      }
    >
      <Guard params={params} />
    </Suspense>
  );
}