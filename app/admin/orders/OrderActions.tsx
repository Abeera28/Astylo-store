"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { STATUS_LABELS } from "../../../lib/order-status";

export default function OrderActions({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(next: string) {
    if (next === status) return;

    if (
      next === "cancelled" &&
      !window.confirm(
        "Cancel this order?\n\nThe pairs will be returned to stock. This cannot be undone."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_set_order_status", {
      p_order_id: id,
      p_status: next,
    });

    if (rpcError) setError(rpcError.message);
    router.refresh();
    setBusy(false);
  }

  async function togglePaid() {
    const next = paymentStatus === "paid" ? "pending" : "paid";

    if (
      next === "paid" &&
      !window.confirm(
        "Mark this order as PAID?\n\nOnly do this after you can see the money in your own JazzCash or Easypaisa app, or after you received the cash. A screenshot alone is not proof."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: next })
      .eq("id", id)
      .select("id");

    if (updateError || !data || data.length === 0) {
      setError("Could not update the payment. Please try again.");
    }
    router.refresh();
    setBusy(false);
  }

  if (status === "cancelled") {
    return (
      <p className="text-sm text-gray-600">
        This order is cancelled. The pairs went back into stock.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor={`status-${id}`}>
          Order status
        </label>
        <select
          id={`status-${id}`}
          value={status}
          disabled={busy}
          onChange={(e) => changeStatus(e.target.value)}
          className="border rounded-lg p-2 bg-white text-black"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={togglePaid}
          disabled={busy}
          className={`rounded-lg px-4 py-2 border disabled:opacity-50 ${
            paymentStatus === "paid"
              ? "border-green-700 text-green-700"
              : "bg-black text-white border-black"
          }`}
        >
          {paymentStatus === "paid"
            ? "Paid ✓ (tap to undo)"
            : "Mark payment received"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}