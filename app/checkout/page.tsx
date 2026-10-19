"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "../SiteHeader";
import {
  METHOD_LABELS,
  availableMethods,
  type PayMethod,
  type ShopSettings,
} from "../PaymentDetails";
import { useCart } from "../../lib/cart";
import { createClient } from "../../lib/supabase/client";

type Errors = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
};

const FIELD_IDS = ["name", "phone", "address", "city"] as const;

function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? "0" + d : null;
}

function validate(v: {
  name: string;
  phone: string;
  address: string;
  city: string;
}) {
  const errors: Errors = {};
  const name = v.name.trim().replace(/\s+/g, " ");
  const address = v.address.trim().replace(/\s+/g, " ");
  const city = v.city.trim().replace(/\s+/g, " ");
  const phone = normalizePhone(v.phone);

  if (!name) {
    errors.name = "Please enter your full name.";
  } else if (!/^[A-Za-z\u0600-\u06FF .'-]{3,60}$/.test(name)) {
    errors.name =
      "Use letters only (3 to 60 characters), like Ayesha Khan. Numbers and symbols are not allowed.";
  }

  if (!v.phone.trim()) {
    errors.phone = "Please enter your mobile number.";
  } else if (!phone) {
    errors.phone =
      "Enter a Pakistani mobile number: 11 digits starting with 03, like 03001234567.";
  }

  if (!address) {
    errors.address = "Please enter your delivery address.";
  } else if (address.length < 10) {
    errors.address =
      "The address is too short. Please add the house number, street and area.";
  } else if (address.length > 200) {
    errors.address = "The address is too long (maximum 200 characters).";
  }

  if (!city) {
    errors.city = "Please enter your city.";
  } else if (!/^[A-Za-z\u0600-\u06FF .'-]{2,40}$/.test(city)) {
    errors.city = "Use letters only, like Lahore.";
  }

  return {
    errors,
    clean: { name, phone: phone ?? "", address, city },
  };
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  autoComplete,
  inputMode,
  maxLength,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel";
  maxLength?: number;
  multiline?: boolean;
}) {
  const className = `w-full border rounded-lg p-2 text-black bg-white ${
    error ? "border-red-600 ring-1 ring-red-600" : ""
  }`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label} <span className="text-red-600">*</span>
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={maxLength}
          rows={3}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={className}
        />
      ) : (
        <input
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={className}
        />
      )}
      {error ? (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      ) : hint ? (
        <p className="text-gray-500 text-xs mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, total, clear } = useCart();

  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [payment, setPayment] = useState<PayMethod>("cod");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/login?next=/checkout");
        return;
      }

      const fullName = data.user.user_metadata?.full_name;
      if (typeof fullName === "string") {
        setName((prev) => prev || fullName);
      }

      const { data: shop } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      setSettings(shop as ShopSettings | null);

      setChecking(false);
    });
  }, [router]);

  const methods = availableMethods(settings);

  function clearError(key: keyof Errors) {
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (placing) return;
    setFormError("");

    const { errors: found, clean } = validate({ name, phone, address, city });
    setErrors(found);

    const first = FIELD_IDS.find((k) => found[k]);
    if (first) {
      setFormError("Please fix the highlighted fields.");
      const el = document.getElementById(`checkout-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    setPlacing(true);
    const supabase = createClient();

    const { data, error: rpcError } = await supabase.rpc("place_order", {
      p_customer_name: clean.name,
      p_phone: clean.phone,
      p_address: clean.address,
      p_city: clean.city,
      p_payment_method: payment,
      p_items: items.map((i) => ({
        productId: i.productId,
        size: i.size,
        quantity: i.quantity,
      })),
    });

    if (rpcError || !data) {
      const text = rpcError?.message ?? "";
      setFormError(
        text.includes("violates check constraint")
          ? "Some of your details were not accepted. Please check them and try again."
          : text || "Could not place the order. Please try again."
      );
      setPlacing(false);
      return;
    }

    clear();
    router.push(`/order/${data}`);
  }

  if (!ready || checking) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <p className="p-6">Loading...</p>
      </main>
    );
  }

  if (items.length === 0 && !placing) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <section className="p-6 max-w-3xl mx-auto">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link href="/" className="underline">
            Continue shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">Delivery details</h2>
            <p className="text-sm text-gray-600">
              Fields marked with <span className="text-red-600">*</span> are
              required.
            </p>

            <Field
              id="checkout-name"
              label="Full name"
              value={name}
              onChange={(v) => {
                setName(v);
                clearError("name");
              }}
              placeholder="e.g. Ayesha Khan"
              hint="The name of the person who will receive the parcel."
              error={errors.name}
              autoComplete="name"
              maxLength={60}
            />

            <Field
              id="checkout-phone"
              label="Mobile number"
              value={phone}
              onChange={(v) => {
                setPhone(v);
                clearError("phone");
              }}
              placeholder="e.g. 03001234567"
              hint="11 digits, starts with 03. The delivery rider will call this number."
              error={errors.phone}
              autoComplete="tel"
              inputMode="tel"
              maxLength={16}
            />

            <Field
              id="checkout-address"
              label="Full address"
              value={address}
              onChange={(v) => {
                setAddress(v);
                clearError("address");
              }}
              placeholder="House or flat number, street, area, nearest landmark"
              hint="Write the address clearly so the parcel reaches you."
              error={errors.address}
              autoComplete="street-address"
              maxLength={200}
              multiline
            />

            <Field
              id="checkout-city"
              label="City"
              value={city}
              onChange={(v) => {
                setCity(v);
                clearError("city");
              }}
              placeholder="e.g. Lahore"
              error={errors.city}
              autoComplete="address-level2"
              maxLength={40}
            />

            <h2 className="text-lg font-semibold pt-2">Payment method</h2>

            {methods.map((m) => (
              <label
                key={m}
                className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === m}
                  onChange={() => setPayment(m)}
                />
                {METHOD_LABELS[m]}
              </label>
            ))}

            {payment !== "cod" && (
              <div className="border rounded-lg p-3 bg-gray-50 text-sm space-y-2">
                <p className="font-medium">Pay with {METHOD_LABELS[payment]}</p>
                <p className="text-gray-600">
                  After you place your order, the account details are shown on
                  the next page. Send the payment screenshot on WhatsApp and we
                  confirm your order.
                </p>
              </div>
            )}

            {formError && (
              <div className="text-red-600 text-sm">
                <p>{formError}</p>
                <Link href="/cart" className="underline">
                  Go back to cart
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={placing}
              className="w-full bg-black text-white rounded-lg px-5 py-3 text-lg disabled:opacity-50"
            >
              {placing ? "Placing order..." : "Place order"}
            </button>
          </form>

          <div>
            <h2 className="text-lg font-semibold mb-3">Order summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex items-center gap-3 border rounded-lg p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <p>Rs. {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="text-xl font-semibold mt-4">
              Total: Rs. {total.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              The final prices and stock are checked when you place the order.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}