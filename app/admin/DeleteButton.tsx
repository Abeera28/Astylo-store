"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

function pathFromUrl(url: string) {
  return url.split("/shoe-images/")[1];
}

export default function DeleteButton({
  id,
  name,
  images,
}: {
  id: string;
  name: string;
  images: string[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const sure = window.confirm(
      `Delete "${name}" completely?\n\nCustomers will no longer see it. This cannot be undone.`
    );
    if (!sure) return;

    setDeleting(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select("id");

    if (error || !data || data.length === 0) {
      alert("Could not delete this shoe. Please try again.");
      setDeleting(false);
      return;
    }

    const paths = (images ?? [])
      .map(pathFromUrl)
      .filter((p): p is string => Boolean(p));

    if (paths.length > 0) {
      await supabase.storage.from("shoe-images").remove(paths);
    }

    router.refresh();
    setDeleting(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="border border-red-600 text-red-600 rounded-lg px-4 py-2 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}