import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import SettingsForm from "./SettingsForm";

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

  const { data: settings } = await supabase
    .from("shop_settings")
        .select(
      "whatsapp, jazzcash_title, jazzcash_number, easypaisa_title, easypaisa_number"
    )
    .eq("id", 1)
    .maybeSingle();

  return (
    <main className="min-h-screen p-6">
      <Link href="/admin" className="underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold my-4">Payment settings</h1>
      {settings ? (
        <SettingsForm initial={settings} />
      ) : (
        <p className="text-red-600">
          Settings row not found. Please run the database step again.
        </p>
      )}
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <Guard />
    </Suspense>
  );
}