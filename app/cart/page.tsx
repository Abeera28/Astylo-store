"use client";

import Link from "next/link";
import SiteHeader from "../SiteHeader";
import { useCart } from "../../lib/cart";

export default function CartPage() {
  const { items, ready, total, setQuantity, removeItem } = useCart();

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your cart</h1>

        {!ready ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <div>
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <Link href="/" className="underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex flex-wrap items-center gap-4 border rounded-lg p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />

                  <div className="flex-1 min-w-40">
                    <Link href={`/shoes/${item.slug}`} className="font-semibold">
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                    <p>Rs. {item.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.size, item.quantity - 1)
                      }
                      className="border rounded-lg w-9 h-9"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.size, item.quantity + 1)
                      }
                      className="border rounded-lg w-9 h-9"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.size)}
                    className="text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xl font-semibold">
                Total: Rs. {total.toLocaleString()}
              </p>
              <Link
                href="/checkout"
                className="bg-black text-white rounded-lg px-6 py-3"
              >
                Checkout
              </Link>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Prices and stock are checked again when you place the order.
            </p>
          </>
        )}
      </section>
    </main>
  );
}