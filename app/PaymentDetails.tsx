export type PayMethod = "cod" | "jazzcash" | "easypaisa";

export type ShopSettings = {
  whatsapp: string;
  jazzcash_title: string;
  jazzcash_number: string;
  easypaisa_title: string;
  easypaisa_number: string;
};

export const METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank transfer (no longer offered)",
};

export function availableMethods(s: ShopSettings | null): PayMethod[] {
  const list: PayMethod[] = ["cod"];
  if (s?.jazzcash_number) list.push("jazzcash");
  if (s?.easypaisa_number) list.push("easypaisa");
  return list;
}

export default function PaymentDetails({
  method,
  settings,
}: {
  method: PayMethod;
  settings: ShopSettings | null;
}) {
  if (!settings || method === "cod") return null;

  let rows: [string, string][] = [];

  if (method === "jazzcash") {
    rows = [
      ["Account title", settings.jazzcash_title],
      ["JazzCash number", settings.jazzcash_number],
    ];
  } else if (method === "easypaisa") {
    rows = [
      ["Account title", settings.easypaisa_title],
      ["Easypaisa number", settings.easypaisa_number],
    ];
  }

  return (
    <div className="space-y-1">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <p key={label}>
            <span className="text-gray-600">{label}:</span>{" "}
            <span className="font-medium">{value}</span>
          </p>
        ))}
    </div>
  );
}