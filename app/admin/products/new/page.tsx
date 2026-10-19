import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import ProductForm from "./ProductForm";

async function Guard() {
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
    redirect("/admin");
  }

  return (
    <main className="min-h-screen p-6">
      <Link href="/admin" className="underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold my-4">Add new shoe</h1>
      <ProductForm />
    </main>
  );
}

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      }
    >
      <Guard />
    </Suspense>
  );
}