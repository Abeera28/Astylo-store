import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import SiteHeader from "../SiteHeader";
import { METHOD_LABELS } from "../PaymentDetails";
import { createClient } from "../../lib/supabase/server";
import {
  paymentText,
  statusClass,
  statusLabel,
} from "../../lib/order-status";

type OrderItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string | null;

};

const STEPS = [
  { key: "new", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function Tracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        This order was cancelled.
      </p>
    );
  }

  const current = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="tracker">
      {STEPS.map((step, index) => (
        <li key={step.key} className={index <= current ? "is-done" : ""}>
          <span className="tracker-dot" />
          <span className="tracker-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

async function OrderList() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/orders");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, items, total, payment_method, payment_status, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border bg-white p-10 text-center">
        <p className="font-serif text-2xl">No orders yet</p>
        <p className="mt-2 text-gray-600">
          When you place an order, you can follow it here.
        </p>
        <Link href="/#shoes" className="btn-solid mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div
      className={
        orders.length === 1 ? "mx-auto max-w-2xl" : "grid gap-5 lg:grid-cols-2"
      }
    >
      {orders.map((order) => {
        const items = order.items as OrderItem[];
        const orderNumber = order.id.slice(0, 8).toUpperCase();
        const date = new Date(order.created_at).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Karachi",
        });

        return (
          <article key={order.id} className="order-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-serif text-xl">Order #{orderNumber}</p>
                <p className="text-xs text-gray-500">{date}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                  order.status
                )}`}
              >
                {statusLabel(order.status)}
              </span>
            </div>

            <Tracker status={order.status} />

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="text-sm text-gray-500">
                                            Size {item.size}
                      {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between gap-3 border-t pt-4">
              <div className="text-sm">
                <p className="text-gray-500">Payment</p>
                <p className="font-medium">
                  {METHOD_LABELS[order.payment_method] ?? order.payment_method}
                </p>
                <p className="text-gray-600">
                  {paymentText(order.payment_method, order.payment_status)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-serif text-2xl">
                  Rs. {Number(order.total).toLocaleString()}
                </p>
              </div>
            </div>

            <Link
              href={`/order/${order.id}`}
              className="btn-outline justify-center text-sm"
            >
              View details
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="page-wrap">
        <Suspense fallback={<p className="text-gray-600">Loading...</p>}>
          <OrderList />
        </Suspense>
      </section>
    </main>
  );
}