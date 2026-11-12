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
import PrintButton from "./PrintButton";

const SHOP_PHONE = "0321 6290737"; // <- put your real shop number here

type OrderItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string | null;
};

function customerMessage(order: any) {
  const number = order.id.slice(0, 8).toUpperCase();
  const total = `Rs. ${Number(order.total).toLocaleString("en-US")}`;
  const name = order.customer_name.split(" ")[0];
  const start = `Hello ${name}, this is Astylo about your order #${number} (${total}).`;

  switch (order.status) {
    case "confirmed":
      return `${start} Your order is confirmed and we are getting it ready for delivery.`;
    case "shipped":
      return order.payment_method === "cod" && order.payment_status !== "paid"
        ? `${start} Your order has been shipped. Please keep ${total} ready for Cash on Delivery.`
        : `${start} Your order has been shipped and will reach you soon.`;
    case "delivered":
      return `${start} Your order has been delivered. Thank you for shopping with Astylo!`;
    case "cancelled":
      return `${start} Your order has been cancelled. Please contact us if you have any questions.`;
    default:
      return `${start} We have received your order and will confirm it shortly.`;
  }
}

async function Guard({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection();
  const { status } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  let query = supabase
    .from("orders")
    .select("id, customer_name, phone, address, city, items, total, payment_method, payment_status, status, created_at")
    .order("created_at", { ascending: false });

  if (status && status in STATUS_LABELS) {
    query = query.eq("status", status);
  }

  const { data: orders } = await query;
  const filters = [["", "All"], ...Object.entries(STATUS_LABELS)];

  return (
    <main className="min-h-screen p-6">
      <div className="no-print">
        <Link href="/admin" className="underline">← Back to dashboard</Link>
        <h1 className="text-2xl font-bold my-4">Orders</h1>

        <div className="flex flex-wrap gap-2 mb-5">
          {filters.map(([value, label]) => {
            const active = (status ?? "") === value;
            return (
              <Link
                key={value || "all"}
                href={value ? `/admin/orders?status=${value}` : "/admin/orders"}
                className={`px-3 py-1 rounded-lg border ${active ? "bg-black text-white border-black" : "bg-white text-black border-gray-400"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-600 no-print">No orders here yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = order.items as OrderItem[];
            const orderNumber = order.id.slice(0, 8).toUpperCase();
            const date = new Date(order.created_at).toLocaleString("en-GB", {
              dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi",
            });
            const whatsapp = order.phone.startsWith("0") ? "92" + order.phone.slice(1) : order.phone;
            const isCod = order.payment_method === "cod" && order.payment_status !== "paid";
            const totalQty = items.reduce((n, i) => n + i.quantity, 0);

            // Text used for the Copy and Share buttons
            const textToShare = `🛍️ ASTYLO SHOES - Order #${orderNumber}\n\n👤 Name: ${order.customer_name}\n📞 Phone: ${order.phone}\n📍 Address: ${order.address}, ${order.city}\n\n📦 Items:\n${items.map(i => `- ${i.name} (Size ${i.size}${i.color ? `, ${i.color}` : ""}) x${i.quantity}`).join("\n")}\n\n💰 Total: Rs. ${Number(order.total).toLocaleString()}\n💳 Payment: ${METHOD_LABELS[order.payment_method] ?? order.payment_method}${isCod ? `\n💵 Collect on delivery: Rs. ${Number(order.total).toLocaleString()}` : ""}`;

            return (
              <div key={order.id} className="border rounded-xl p-4 space-y-3 print-area">

                {/* --- SCREEN VIEW --- */}
                <div className="no-print">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold">Order #{orderNumber}</p>
                      <p className="text-sm text-gray-600">{date}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${statusClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="text-sm mb-3">
                    <p className="font-medium">{order.customer_name}</p>
                    <p>
                      <a href={`tel:${order.phone}`} className="underline">{order.phone}</a>
                      {" · "}
                      <a
                        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(customerMessage(order))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        WhatsApp
                      </a>
                    </p>
                    <p>{order.address}, {order.city}</p>
                  </div>

                  <div className="space-y-2 mb-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                        )}
                        <p className="text-sm flex-1">
                          {item.name} (size {item.size}{item.color ? `, color ${item.color}` : ""}) × {item.quantity}
                        </p>
                        <p className="text-sm">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-4">
                    <p>
                      {METHOD_LABELS[order.payment_method] ?? order.payment_method} ·{" "}
                      <span className={order.payment_status === "paid" ? "text-green-700 font-medium" : "text-orange-600 font-medium"}>
                        {paymentText(order.payment_method, order.payment_status)}
                      </span>
                    </p>
                    <p className="font-semibold text-base">Total: Rs. {Number(order.total).toLocaleString()}</p>
                  </div>

                  <div className="space-y-3">
                    <OrderActions id={order.id} status={order.status} paymentStatus={order.payment_status} />
                    <PrintButton orderText={textToShare} />
                  </div>
                </div>

                {/* --- PRINT VIEW: package front label + packing slip --- */}
                <div className="hidden print:block text-black font-sans">
                  {/* ===== PACKAGE FRONT LABEL ===== */}
                  <div className="border-4 border-black p-4">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                      <h2 className="text-3xl font-black uppercase tracking-widest">ASTYLO SHOES</h2>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase">Order</p>
                        <p className="text-2xl font-mono font-black tracking-widest">#{orderNumber}</p>
                      </div>
                    </div>

                    <p className="text-xs uppercase font-bold text-gray-600">Deliver To</p>
                    <p className="text-3xl font-black leading-tight">{order.customer_name}</p>
                    <p className="text-2xl font-bold mt-1">📞 {order.phone}</p>
                    <p className="text-2xl leading-snug mt-2">{order.address}</p>
                    <p className="text-3xl font-black uppercase mt-1">{order.city}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="border-2 border-black p-3 text-center">
                        <p className="text-xs font-bold uppercase">Payment</p>
                        <p className="text-lg font-black">
                          {METHOD_LABELS[order.payment_method] ?? order.payment_method}
                        </p>
                        <p className="text-sm">{totalQty} item{totalQty > 1 ? "s" : ""}</p>
                      </div>
                      <div className={`border-2 border-black p-3 text-center ${isCod ? "bg-black text-white" : ""}`}>
                        <p className="text-xs font-bold uppercase">
                          {isCod ? "Collect Cash on Delivery" : "Paid - Do Not Collect"}
                        </p>
                        <p className="text-3xl font-black">
                          {isCod ? `Rs. ${Number(order.total).toLocaleString()}` : "Rs. 0"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between text-xs border-t border-black pt-2">
                      <p>From: Astylo Shoes · {SHOP_PHONE}</p>
                      <p>{date}</p>
                    </div>
                  </div>

                  {/* cut line */}
                  <p className="my-4 text-center text-xs text-gray-500 tracking-widest">
                    ✂ - - - - - - - - - - - - cut here / keep inside the parcel - - - - - - - - - - - - ✂
                  </p>

                  {/* ===== PACKING SLIP (goes inside the box) ===== */}
                  <div>
                    <p className="text-sm font-bold uppercase mb-2">Packing Slip · Order #{orderNumber}</p>
                    <table className="w-full text-left mb-4">
                      <thead>
                        <tr className="border-b-2 border-black">
                          <th className="pb-1 text-xs uppercase">Item</th>
                          <th className="pb-1 text-xs uppercase text-center">Size</th>
                          <th className="pb-1 text-xs uppercase text-center">Color</th>
                          <th className="pb-1 text-xs uppercase text-center">Qty</th>
                          <th className="pb-1 text-xs uppercase text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-300">
                            <td className="py-2 font-semibold">{item.name}</td>
                            <td className="py-2 text-center">{item.size}</td>
                            <td className="py-2 text-center">{item.color || "-"}</td>
                            <td className="py-2 text-center font-bold">{item.quantity}</td>
                            <td className="py-2 text-right">Rs. {(item.price * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end border-t-2 border-black pt-2">
                      <p className="text-xl font-black">Total: Rs. {Number(order.total).toLocaleString()}</p>
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-600">
                      Thank you for shopping with Astylo! Questions? WhatsApp us on {SHOP_PHONE}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <Guard searchParams={searchParams} />
    </Suspense>
  );
}