"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";

type Info = {
  email: string;
  phone: string;
  address: string;
  map_url: string;
};

type Errors = Partial<Record<keyof Info, string>>;

const FIELD_ORDER: (keyof Info)[] = ["email", "phone", "address", "map_url"];

function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0092")) d = "0" + d.slice(4);
  else if (d.startsWith("92") && d.length >= 11) d = "0" + d.slice(2);
  return /^0\d{9,10}$/.test(d) ? d : null;
}

function validate(v: Info) {
  const errors: Errors = {};
  const clean: Info = { email: "", phone: "", address: "", map_url: "" };

  const email = v.email.trim().toLowerCase();
  if (email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 100) {
      errors.email = "Enter a valid email address, like shop@example.com.";
    } else {
      clean.email = email;
    }
  }

  if (v.phone.trim()) {
    const p = normalizePhone(v.phone);
    if (!p) {
      errors.phone =
        "Enter a phone number like 03001234567 (mobile) or 0552345678 (landline).";
    } else {
      clean.phone = p;
    }
  }

  const address = v.address.trim().replace(/\s+/g, " ");
  if (address) {
    if (address.length < 10) {
      errors.address =
        "The address is too short. Add the shop number, street, area and city.";
    } else if (address.length > 200) {
      errors.address = "The address is too long (maximum 200 characters).";
    } else {
      clean.address = address;
    }
  }

  const map = v.map_url.trim();
  if (map) {
    if (!/^https:\/\/\S+$/.test(map) || map.length > 500) {
      errors.map_url = "Paste the full Google Maps link. It starts with https://";
    } else {
      clean.map_url = map;
    }
  }

  return { errors, clean };
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  multiline,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  inputMode?: "text" | "tel" | "email" | "url";
  maxLength?: number;
}) {
  const className = `w-full border rounded-lg p-2 text-black bg-white ${
    error ? "border-red-600 ring-1 ring-red-600" : ""
  }`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          rows={3}
          maxLength={maxLength}
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
          autoComplete="off"
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

export default function ShopInfoForm({ initial }: { initial: Info }) {
  const [s, setS] = useState<Info>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(key: keyof Info, value: string) {
    setS({ ...s, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const { errors: found, clean } = validate(s);
    setErrors(found);

    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      setError("Please fix the highlighted fields.");
      const el = document.getElementById(first);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("shop_info")
      .update(clean)
      .eq("id", 1)
      .select("id");

    if (updateError) {
      setError(`Could not save. Technical detail: ${updateError.message}`);
    } else if (!data || data.length === 0) {
      setError("Could not save. You may be logged out. Please log in again.");
    } else {
      setS(clean);
      setMessage("Saved! It now shows in the footer of the website.");
    }
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      noValidate
      className="max-w-xl space-y-5"
    >
      <p className="text-sm text-gray-600">
        These details are shown to customers in the footer of every page. Only
        the boxes you fill in are shown.
      </p>

      <Field
        id="email"
        label="Email address"
        value={s.email}
        onChange={(v) => set("email", v)}
        placeholder="e.g. shop@example.com"
        inputMode="email"
        maxLength={100}
        error={errors.email}
      />

      <Field
        id="phone"
        label="Phone number"
        value={s.phone}
        onChange={(v) => set("phone", v)}
        placeholder="e.g. 03001234567"
        hint="Customers can tap it to call. A mobile number also gets a WhatsApp link."
        inputMode="tel"
        maxLength={20}
        error={errors.phone}
      />

      <Field
        id="address"
        label="Shop address"
        value={s.address}
        onChange={(v) => set("address", v)}
        placeholder="Shop number, street, area, city"
        multiline
        maxLength={200}
        error={errors.address}
      />

      <Field
        id="map_url"
        label="Google Maps link (optional)"
        value={s.map_url}
        onChange={(v) => set("map_url", v)}
        placeholder="https://maps.app.goo.gl/..."
        hint="In Google Maps, find your shop, tap Share, copy the link and paste it here. If you leave this empty, the website makes a map link from the address."
        inputMode="url"
        maxLength={500}
        error={errors.map_url}
      />

      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-black text-white rounded-lg px-5 py-2 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save shop info"}
      </button>
    </form>
  );
}