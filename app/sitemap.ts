import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("products")
    .select("slug, created_at")
    .eq("is_active", true);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...(data ?? []).map((p) => ({
      url: `${base}/shoes/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}