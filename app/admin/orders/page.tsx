import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { METHOD_LABELS } from "../../PaymentDetails";
import {
  STATUS_LABELS,
  paymentText,
  statusClass,
  statusLabel,
} from "../../../lib/order-status";
import OrderActions from "./OrderActions";

type OrderItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string | null;
};

async function Guard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await connection();

  const { status } = await searchParams;
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

  let query = supabase
    .from("orders")
    .select(
      "id, customer_name, phone, address, city, items, total, payment_method, payment_status, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (status && status in STATUS_LABELS) {
    query = query.eq("status", status);
  }

  const { data: orders } = await query;

  const filters = [["", "All"], ...Object.entries(STATUS_LABELS)];

  return (
    <main className="min-h-screen p-6">
      <Link href="/admin" className="underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold my-4">Orders</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(([value, label]) => {
          const active = (status ?? "") === value;
          return (
            <Link
              key={value || "all"}
              href={value ? `/admin/orders?status=${value}` : "/admin/orders"}
              className={`px-3 py-1 rounded-lg border ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-400"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-600">No orders here yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = order.items as OrderItem[];
            const orderNumber = order.id.slice(0, 8).toUpperCase();
            const date = new Date(order.created_at).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Karachi",
            });
            const whatsapp = order.phone.startsWith("0")
              ? "92" + order.phone.slice(1)
              : order.phone;

            return (
              <div key={order.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">Order #{orderNumber}</p>
                    <p className="text-sm text-gray-600">{date}</p>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${statusClass(
                      order.status
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="text-sm">
                  <p className="font-medium">{order.customer_name}</p>
                  <p>
                    <a href={`tel:${order.phone}`} className="underline">
                      {order.phone}
                    </a>
                    {" · "}
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      WhatsApp
                    </a>
                  </p>
                  <p>
                    {order.address}, {order.city}
                  </p>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                      )}
                      <p className="text-sm flex-1">
                        {item.name} (size {item.size}
                        {item.color ? `, color ${item.color}` : ""}) ×{" "}
                        {item.quantity}
                      </p>
                      <p className="text-sm">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p>
                    {METHOD_LABELS[order.payment_method] ??
                      order.payment_method}{" "}
                    ·{" "}
                    <span
                      className={
                        order.payment_status === "paid"
                          ? "text-green-700 font-medium"
                          : "text-orange-600 font-medium"
                      }
                    >
                      {paymentText(order.payment_method, order.payment_status)}
                    </span>
                  </p>
                  <p className="font-semibold text-base">
                    Total: Rs. {Number(order.total).toLocaleString()}
                  </p>
                </div>

                <OrderActions
                  id={order.id}
                  status={order.status}
                  paymentStatus={order.payment_status}
                />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <Guard searchParams={searchParams} />
    </Suspense>
  );
}