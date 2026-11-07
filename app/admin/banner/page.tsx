import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import BannerForm from "./BannerForm";

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

  const { data: info } = await supabase
    .from("shop_info")
    .select("hero_image_url")
    .eq("id", 1)
    .maybeSingle();

  const { data: products } = await supabase
    .from("products")
    .select("name, images")
    .order("created_at", { ascending: false });

  const photos = (products ?? [])
    .flatMap((p) =>
      ((p.images ?? []) as string[]).map((url) => ({ url, name: p.name as string }))
    )
    .slice(0, 60);

  return (
    <main className="min-h-screen p-6">
      <Link href="/admin" className="underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold my-4">Home banner picture</h1>
      {info ? (
        <BannerForm current={info.hero_image_url ?? ""} photos={photos} />
      ) : (
        <p className="text-red-600">
          Shop info row not found. Please run the database steps again.
        </p>
      )}
    </main>
  );
}

export default function BannerPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <Guard />
    </Suspense>
  );
}