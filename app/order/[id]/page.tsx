import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "../../SiteHeader";
import PaymentInstructions from "../../PaymentInstructions";
import type { PayMethod, ShopSettings } from "../../PaymentDetails";
import { createClient } from "../../../lib/supabase/server";

type OrderItem = {
  name: string;
  size: string;
  color?: string | null;
  quantity: number;
  price: number;
  image?: string;
};

async function OrderDetails({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/order/${id}`);
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, customer_name, phone, address, city, items, total, payment_method, payment_status, status, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  const { data: shop } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const settings = shop as ShopSettings | null;

  const items = order.items as OrderItem[];
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const method = order.payment_method as PayMethod;
  const isWallet = method === "jazzcash" || method === "easypaisa";

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="p-6 max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold">
            Thank you! Your order is placed.
          </h1>
          <p className="text-gray-600 mt-1">Order number: #{orderNumber}</p>
        </div>

        {method === "cod" && (
          <p className="border rounded-lg p-4 bg-gray-50 text-sm">
            You will pay in cash when your order is delivered.
          </p>
        )}

        {isWallet && order.payment_status === "paid" && (
          <p className="border rounded-lg p-4 bg-green-50 text-sm text-green-800">
            Payment received. Thank you!
          </p>
        )}

        {isWallet && order.payment_status !== "paid" && (
          <PaymentInstructions
            method={method}
            settings={settings}
            amount={Number(order.total)}
            orderNumber={orderNumber}
          />
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border rounded-lg p-2"
            >
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">
                  Size {item.size}
                  {item.color ? ` · ${item.color}` : ""} × {item.quantity}
                </p>
              </div>
              <p>Rs. {(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <p className="text-xl font-semibold">
          Total: Rs. {Number(order.total).toLocaleString()}
        </p>

        <div className="text-sm text-gray-700">
          <p className="font-medium">Delivering to</p>
          <p>{order.customer_name}</p>
          <p>{order.phone}</p>
          <p>
            {order.address}, {order.city}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/orders" className="btn-outline">
            View my orders
          </Link>
          <Link href="/#shoes" className="btn-solid">
            Continue shopping
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <OrderDetails params={params} />
    </Suspense>
  );
}