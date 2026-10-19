import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import SignOutButton from "./SignOutButton";
import DeleteButton from "./DeleteButton";

async function AdminContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg">You are not allowed to open this page.</p>
        <SignOutButton />
      </main>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, sizes, images, stock")
    .order("created_at", { ascending: false });

  const totalPairs = (products ?? []).reduce((sum, p) => sum + (p.stock ?? 0), 0);

  return (
    <main className="min-h-screen p-6">
      <p className="eyebrow mb-1">Dashboard</p>
      <h1 className="text-4xl md:text-5xl">Your shoes</h1>

      <div className="grid grid-cols-2 gap-3 mt-6 max-w-md">
        <div className="bg-white border rounded-2xl p-5">
          <p className="font-serif text-4xl">{products?.length ?? 0}</p>
          <p className="text-sm text-gray-600 mt-1">Shoes listed</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="font-serif text-4xl">{totalPairs}</p>
          <p className="text-sm text-gray-600 mt-1">Pairs in stock</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-2xl">All shoes</h2>
        <Link
          href="/admin/products/new"
          className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          + Add new shoe
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {products && products.length > 0 ? (
          products.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-4 bg-white border rounded-2xl p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images?.[0]}
                alt={p.name}
                className="w-20 h-20 object-cover rounded-xl"
              />
              <div className="flex-1 min-w-48">
                <p className="font-semibold">{p.name}</p>
                <p className="price">Rs. {Number(p.price).toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  Sizes: {p.sizes?.join(", ")}
                </p>
                {p.stock > 0 ? (
                  <p className="text-sm font-semibold text-green-700">
                    {p.stock} {p.stock === 1 ? "pair" : "pairs"} in stock
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-red-600">
                    Out of stock
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="border border-black rounded-full px-4 py-2 text-sm font-semibold hover:bg-black hover:text-white"
                >
                  Edit
                </Link>
                <DeleteButton id={p.id} name={p.name} images={p.images ?? []} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No shoes yet. Add your first one!</p>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}