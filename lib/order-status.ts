export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function statusClass(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-indigo-100 text-indigo-800";
    case "shipped":
      return "bg-orange-100 text-orange-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function paymentText(method: string, paymentStatus: string) {
  if (paymentStatus === "paid") return "Paid";
  if (method === "cod") return "Pay on delivery";
  return "Waiting for payment";
}