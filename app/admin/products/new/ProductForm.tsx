"use client";

import {
  useState,
  type FormEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ColorPicker, { type ColorOption } from "./ColorPicker";


const DEFAULT_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const MAX_IMAGES = 8;
const ACCEPT = "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif";

type Preview = { file: File; url: string };

type EditableProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  sizes: string[];
  images: string[];
  stock: number;
  colors: ColorOption[];
};

function makeSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "shoe";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

function sortSizes(list: string[]) {
  return [...list].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    const aIsNum = !Number.isNaN(na);
    const bIsNum = !Number.isNaN(nb);
    if (aIsNum && bIsNum) return na - nb;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a.localeCompare(b);
  });
}

function pathFromUrl(url: string) {
  return url.split("/shoe-images/")[1];
}

async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1200;
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

export default function ProductForm({ product }: { product?: EditableProduct }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [sizeOptions, setSizeOptions] = useState<string[]>(
    sortSizes(Array.from(new Set([...DEFAULT_SIZES, ...(product?.sizes ?? [])])))
  );
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [colors, setColors] = useState<ColorOption[]>(product?.colors ?? []);
  const [newSize, setNewSize] = useState("");
  const [existing, setExisting] = useState<string[]>(product?.images ?? []);
  const [images, setImages] = useState<Preview[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function addFiles(fileList: File[]) {
    setError("");
    const good: Preview[] = [];
    const bad: string[] = [];

    for (const file of fileList) {
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        good.push({ file, url: URL.createObjectURL(file) });
      } catch {
        bad.push(file.name);
      }
    }

    const room = MAX_IMAGES - existing.length - images.length;
    setImages((prev) => [...prev, ...good].slice(0, MAX_IMAGES - existing.length));

    if (bad.length > 0) {
      setError(
        `These photos could not be opened: ${bad.join(", ")}. Please use JPG, PNG or WEBP photos. Phone photos in HEIC format must be converted to JPG first.`
      );
    } else if (good.length > room) {
      setError(`Only ${MAX_IMAGES} photos are allowed for one shoe.`);
    }
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    addFiles(picked);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function toggleSize(size: string) {
    setSizes(
      sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size]
    );
  }

  function addCustomSize() {
    const value = newSize.trim();
    if (!value) return;
    if (value.length > 10) {
      setError("A size can be at most 10 characters.");
      return;
    }
    setError("");

    const found = sizeOptions.find(
      (s) => s.toLowerCase() === value.toLowerCase()
    );
    const finalSize = found ?? value;

    if (!found) setSizeOptions(sortSizes([...sizeOptions, finalSize]));
    if (!sizes.includes(finalSize)) setSizes([...sizes, finalSize]);
    setNewSize("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const stockNumber = Number(stock);

    if (!name.trim()) return setError("Please enter the shoe name.");
    if (!price || Number(price) <= 0)
      return setError("Please enter a valid price.");
    if (stock === "" || !Number.isInteger(stockNumber) || stockNumber < 0)
      return setError("Please enter how many pairs are in stock (0 or more).");
    if (sizes.length === 0) return setError("Please select at least one size.");
    if (existing.length + images.length === 0)
      return setError("Please add at least one photo.");

    setSaving(true);
    const supabase = createClient();
    const slug = product?.slug ?? makeSlug(name);
    const uploadedPaths: string[] = [];

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const blob = await resizeImage(images[i].file);
        const path = `${slug}/${Date.now()}-${i + 1}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("shoe-images")
          .upload(path, blob, { contentType: "image/jpeg" });

        if (uploadError) throw new Error(uploadError.message);

        uploadedPaths.push(path);
        const { data } = supabase.storage.from("shoe-images").getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }

      const values = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: stockNumber,
        sizes: sortSizes(sizes),
        colors,
        images: [...existing, ...newUrls],
      };

      if (product) {
        const { data: updated, error: updateError } = await supabase
          .from("products")
          .update(values)
          .eq("id", product.id)
          .select("id");

        if (updateError) throw new Error(updateError.message);
        if (!updated || updated.length === 0)
          throw new Error("Could not save the changes.");

        const removed = product.images
          .filter((url) => !existing.includes(url))
          .map(pathFromUrl)
          .filter((p): p is string => Boolean(p));

        if (removed.length > 0) {
          await supabase.storage.from("shoe-images").remove(removed);
        }
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert({ ...values, slug });

        if (insertError) throw new Error(insertError.message);
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("shoe-images").remove(uploadedPaths);
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="max-w-xl space-y-5">
      <div>
        <label className="block font-medium mb-1">Shoe name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          className="w-full border rounded-lg p-2 text-black bg-white"
          placeholder="e.g. Astylo Classic Runner"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="off"
          rows={4}
          className="w-full border rounded-lg p-2 text-black bg-white"
          placeholder="Material, comfort, colour, care..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Price (Rs.)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            autoComplete="off"
            className="w-full border rounded-lg p-2 text-black bg-white"
            placeholder="e.g. 4500"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Pairs in stock</label>
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            autoComplete="off"
            className="w-full border rounded-lg p-2 text-black bg-white"
            placeholder="e.g. 10"
          />
        </div>
      </div>
      <p className="text-sm text-gray-600 -mt-3">
        When stock reaches 0, customers see &quot;Out of stock&quot;.
      </p>

      <div>
        <label className="block font-medium mb-1">Available sizes</label>
        <p className="text-sm text-gray-600 mb-2">
          Tap a size to select it. Need another size? Add it below.
        </p>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1 rounded-lg border ${
                sizes.includes(size)
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-400"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSize();
              }
            }}
            autoComplete="off"
            className="border rounded-lg p-2 text-black bg-white w-48"
            placeholder="Other size, e.g. 47"
          />
          <button
            type="button"
            onClick={addCustomSize}
            className="bg-gray-800 text-white rounded-lg px-4 py-2"
          >
            Add size
          </button>
        </div>
      </div>
          <ColorPicker value={colors} onChange={setColors} />

      <div>
        <label className="block font-medium mb-1">
          Photos (up to {MAX_IMAGES}). The first photo is the main photo.
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragging ? "border-black bg-gray-100" : "border-gray-400"
          }`}
        >
          <p className="mb-3 text-gray-700">Drag photos here, or</p>
          <label
            htmlFor="photos"
            className="inline-block bg-black text-white rounded-lg px-5 py-2 cursor-pointer"
          >
            Add photos
          </label>
          <input
            id="photos"
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          <p className="mt-3 text-sm text-gray-600">
            {existing.length + images.length} of {MAX_IMAGES} photos added
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          {existing.map((url, index) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-28 object-cover rounded-lg border"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-0.5 rounded">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => setExisting(existing.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded"
              >
                X
              </button>
            </div>
          ))}

          {images.map((img, index) => (
            <div key={img.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`New photo ${index + 1}`}
                className="w-full h-28 object-cover rounded-lg border"
              />
              {existing.length === 0 && index === 0 && (
                <span className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-0.5 rounded">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => setImages(images.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-black text-white rounded-lg px-5 py-2 disabled:opacity-50"
      >
        {saving ? "Saving..." : product ? "Save changes" : "Save shoe"}
      </button>
    </form>
  );
}