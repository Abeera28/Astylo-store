"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type Photo = { url: string; name: string };
type Upload = { file: File; preview: string };

function pathFromUrl(url: string) {
  return url.split("/shoe-images/")[1];
}

function isHeroFile(url: string) {
  return (pathFromUrl(url) ?? "").startsWith("hero/");
}

async function resizeBlob(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const maxSize = 1400;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not process the image")),
      "image/jpeg",
      0.8
    );
  });
}

export default function BannerForm({
  current: initialCurrent,
  photos,
}: {
  current: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(initialCurrent);
  const [picked, setPicked] = useState<string | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = upload?.preview ?? picked ?? (removed ? "" : current);
  const hasChange = Boolean(upload || picked || removed);

  function clearUpload() {
    if (upload) URL.revokeObjectURL(upload.preview);
    setUpload(null);
  }

  function choosePhoto(url: string) {
    setError("");
    setMessage("");
    clearUpload();
    setPicked(url);
    setRemoved(false);
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setMessage("");

    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
    } catch {
      setError(
        "This photo could not be opened. Please use a JPG, PNG or WEBP picture."
      );
      return;
    }

    clearUpload();
    setUpload({ file, preview: URL.createObjectURL(file) });
    setPicked(null);
    setRemoved(false);
  }

  function removeBanner() {
    setError("");
    setMessage("");
    clearUpload();
    setPicked(null);
    setRemoved(true);
  }

  async function handleSave() {
    if (!hasChange) return;

    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    let uploadedPath: string | null = null;

    try {
      let newUrl = "";

      if (upload || picked) {
        // a copy is stored, so deleting a shoe later cannot break the banner
        const source: Blob = upload
          ? upload.file
          : await (await fetch(picked as string)).blob();
        const blob = await resizeBlob(source);
        const path = `hero/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("shoe-images")
          .upload(path, blob, { contentType: "image/jpeg" });

        if (uploadError) throw new Error(uploadError.message);

        uploadedPath = path;
        newUrl = supabase.storage.from("shoe-images").getPublicUrl(path).data
          .publicUrl;
      }

      const { data, error: updateError } = await supabase
        .from("shop_info")
        .update({ hero_image_url: newUrl })
        .eq("id", 1)
        .select("id");

      if (updateError) throw new Error(updateError.message);
      if (!data || data.length === 0)
        throw new Error("Could not save. You may be logged out.");

      if (current && isHeroFile(current) && current !== newUrl) {
        const old = pathFromUrl(current);
        if (old) await supabase.storage.from("shoe-images").remove([old]);
      }

      clearUpload();
      setPicked(null);
      setRemoved(false);
      setCurrent(newUrl);
      setMessage(
        newUrl
          ? "Saved! The home page now shows this picture."
          : "Saved! The home page banner picture was removed."
      );
      router.refresh();
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("shoe-images").remove([uploadedPath]);
      }
      setError(
        err instanceof Error
          ? `Could not save. ${err.message} If you picked a shoe photo, try uploading the picture instead.`
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-600">
        This picture is shown on the home page of your website. It stays the
        same until you change it here, even when you add new shoes. A vertical
        (portrait) picture works best.
      </p>

      <div>
        <p className="font-medium mb-2">Banner picture now</p>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Banner picture"
            className="w-40 aspect-[4/5] object-cover rounded-xl border"
          />
        ) : (
          <p className="text-gray-600 text-sm">
            No picture chosen yet. The home page shows an empty soft frame.
          </p>
        )}
        {hasChange && (
          <p className="mt-2 text-sm text-orange-600">
            Not saved yet. Press &quot;Save banner picture&quot; below.
          </p>
        )}
      </div>

      {photos.length > 0 && (
        <div>
          <p className="font-medium mb-1">Choose from your shoe photos</p>
          <p className="text-sm text-gray-600 mb-3">Tap a photo to select it.</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p) => (
              <button
                key={p.url}
                type="button"
                onClick={() => choosePhoto(p.url)}
                title={p.name}
                className={`overflow-hidden rounded-lg border-2 ${
                  picked === p.url
                    ? "border-black ring-2 ring-black"
                    : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.name}
                  className="w-full aspect-[4/5] object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-medium mb-2">Or upload a new picture</p>
        <label
          htmlFor="banner-file"
          className="inline-block bg-gray-800 text-white rounded-lg px-5 py-2 cursor-pointer"
        >
          Choose a picture
        </label>
        <input
          id="banner-file"
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChange}
          className="bg-black text-white rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save banner picture"}
        </button>
        {(current || picked || upload) && (
          <button
            type="button"
            onClick={removeBanner}
            disabled={saving}
            className="border border-black rounded-lg px-5 py-2 disabled:opacity-50"
          >
            Remove picture
          </button>
        )}
      </div>
    </div>
  );
}