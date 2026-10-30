"use client";

import { useState } from "react";
import { useCart } from "../../../lib/cart";
import ProductGallery from "./ProductGallery";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sizes: string[];
  images: string[];
  stock: number;
  colors: { name: string; hex: string }[];
  unavailable_colors: Record<string, string[]> | null;
};

export default function ProductDetails({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [colorNote, setColorNote] = useState("");
  const { addItem } = useCart();

  const colors = product.colors ?? [];
  const blockedBySize = product.unavailable_colors ?? {};
  const priceText = `Rs. ${Number(product.price).toLocaleString()}`;
  const outOfStock = product.stock <= 0;

  function colorsForSize(size: string) {
    const blocked = blockedBySize[size] ?? [];
    return colors.filter((c) => !blocked.includes(c.name));
  }

  function sizeHasNoColor(size: string) {
    return colors.length > 0 && colorsForSize(size).length === 0;
  }

  function colorBlocked(colorName: string) {
    if (!selectedSize) return false;
    return !colorsForSize(selectedSize).some((c) => c.name === colorName);
  }

  function chooseSize(size: string) {
    setSelectedSize(size);

    if (
      selectedColor &&
      !colorsForSize(size).some((c) => c.name === selectedColor)
    ) {
      setColorNote(
        `${selectedColor} is not available in size ${size}. Please choose another color.`
      );
      setSelectedColor(null);
    } else {
      setColorNote("");
    }
  }

  function chooseColor(colorName: string) {
    setSelectedColor(colorName);
    setColorNote("");
  }

  function handleAddToCart() {
    if (!selectedSize) {
      setCartMessage("Please select a size first.");
      setTimeout(() => setCartMessage(""), 2500);
      return;
    }

    if (colors.length > 0 && !selectedColor) {
      setCartMessage("Please select a color first.");
      setTimeout(() => setCartMessage(""), 2500);
      return;
    }

    const added = addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      image: product.images[0],
      size: selectedSize,
      color: selectedColor ?? "",
      colorHex: colors.find((c) => c.name === selectedColor)?.hex ?? "",
      quantity: 1,
      maxStock: product.stock,
    });

    setCartMessage(
      added
        ? "Added to cart!"
        : "You already have all the available pairs in your cart."
    );
    setTimeout(() => setCartMessage(""), 2500);
  }

  function shareText() {
    return `${product.name} - ${priceText}\n${window.location.href}`;
  }

  async function handleShare() {
    const url = window.location.href;
    const text = shareText();

    try {
      const res = await fetch(product.images[selectedImage]);
      const blob = await res.blob();
      const file = new File([blob], "shoe.jpg", {
        type: blob.type || "image/jpeg",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: product.name, text });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    handleWhatsApp();
  }

  function handleWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText())}`,
      "_blank"
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Link copied!");
    } catch {
      setMessage("Could not copy the link.");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <ProductGallery
        images={product.images}
        name={product.name}
        selected={selectedImage}
        onSelect={setSelectedImage}
      />

      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl mt-1">{priceText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="bg-black text-white rounded-lg px-4 py-2"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="bg-green-600 text-white rounded-lg px-4 py-2"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="border border-black rounded-lg px-4 py-2"
          >
            Copy link
          </button>
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>

        {outOfStock ? (
          <p className="text-red-600 font-semibold">Out of stock</p>
        ) : product.stock <= 5 ? (
          <p className="text-orange-600 font-semibold">
            Only {product.stock} {product.stock === 1 ? "pair" : "pairs"} left
          </p>
        ) : (
          <p className="text-green-700 font-semibold">In stock</p>
        )}

        <div>
          <p className="font-medium mb-2">Select size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                disabled={sizeHasNoColor(size)}
                title={
                  sizeHasNoColor(size) ? "Not available right now" : undefined
                }
                onClick={() => chooseSize(size)}
                className={`px-4 py-2 rounded-lg border disabled:opacity-40 disabled:line-through ${
                  selectedSize === size
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {colors.length > 0 && (
          <div>
            <p className="font-medium mb-2">
              Select color
              {selectedColor && (
                <span className="font-normal text-gray-600">
                  {" "}
                  · {selectedColor}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const blocked = colorBlocked(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    disabled={blocked}
                    title={
                      blocked
                        ? `${c.name} is not available in size ${selectedSize}`
                        : c.name
                    }
                    aria-label={c.name}
                    onClick={() => chooseColor(c.name)}
                    className={`color-swatch ${
                      selectedColor === c.name ? "is-selected" : ""
                    }`}
                  >
                    <span className="color-dot" style={{ background: c.hex }} />
                  </button>
                );
              })}
            </div>
            {colorNote ? (
              <p className="mt-2 text-sm text-orange-600">{colorNote}</p>
            ) : !selectedSize ? (
              <p className="mt-2 text-xs text-gray-500">
                Choose a size to see which colors are available in it.
              </p>
            ) : null}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-full bg-black text-white rounded-lg px-5 py-3 text-lg disabled:opacity-50"
          >
            {outOfStock ? "Out of stock" : "Add to cart"}
          </button>
          {cartMessage && (
            <p className="mt-2 text-sm text-gray-700">{cartMessage}</p>
          )}
        </div>

        {product.description && (
          <div>
            <p className="font-medium mb-1">Description</p>
            <p className="text-gray-700 whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}