"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";

type Settings = {
  whatsapp: string;
  jazzcash_title: string;
  jazzcash_number: string;
  easypaisa_title: string;
  easypaisa_number: string;
};

type Errors = Partial<Record<keyof Settings, string>>;

const FIELD_ORDER: (keyof Settings)[] = [
  "jazzcash_title",
  "jazzcash_number",
  "easypaisa_title",
  "easypaisa_number",
  "whatsapp",
];

const PHONE_ERROR =
  "Enter a Pakistani mobile number: 11 digits starting with 03, like 03001234567.";

function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? "0" + d : null;
}

function inUse(...values: string[]) {
  return values.some((v) => v.trim() !== "");
}

function validate(s: Settings): { errors: Errors; clean: Settings } {
  const errors: Errors = {};
  const clean: Settings = {
    whatsapp: "",
    jazzcash_title: s.jazzcash_title.trim(),
    jazzcash_number: "",
    easypaisa_title: s.easypaisa_title.trim(),
    easypaisa_number: "",
  };

  const jazzUsed = inUse(s.jazzcash_title, s.jazzcash_number);
  const easyUsed = inUse(s.easypaisa_title, s.easypaisa_number);

  if (jazzUsed) {
    if (clean.jazzcash_title.length < 3) {
      errors.jazzcash_title =
        "Enter the name registered on the JazzCash account (at least 3 letters).";
    }
    const p = normalizePhone(s.jazzcash_number);
    if (!p) errors.jazzcash_number = PHONE_ERROR;
    else clean.jazzcash_number = p;
  }

  if (easyUsed) {
    if (clean.easypaisa_title.length < 3) {
      errors.easypaisa_title =
        "Enter the name registered on the Easypaisa account (at least 3 letters).";
    }
    const p = normalizePhone(s.easypaisa_number);
    if (!p) errors.easypaisa_number = PHONE_ERROR;
    else clean.easypaisa_number = p;
  }

  if (s.whatsapp.trim()) {
    const p = normalizePhone(s.whatsapp);
    if (!p) errors.whatsapp = PHONE_ERROR;
    else clean.whatsapp = "92" + p.slice(1);
  } else if (jazzUsed || easyUsed) {
    errors.whatsapp =
      "A WhatsApp number is required when you accept JazzCash or Easypaisa payments. Customers send their payment screenshots here.";
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
  required,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  inputMode?: "text" | "tel";
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
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
        className={`w-full border rounded-lg p-2 text-black bg-white ${
          error ? "border-red-600 ring-1 ring-red-600" : ""
        }`}
      />
      {error ? (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      ) : hint ? (
        <p className="text-gray-500 text-xs mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(key: keyof Settings, value: string) {
    setS({ ...s, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  const jazzUsed = inUse(s.jazzcash_title, s.jazzcash_number);
  const easyUsed = inUse(s.easypaisa_title, s.easypaisa_number);
  const whatsappRequired = jazzUsed || easyUsed;

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
      .from("shop_settings")
      .update(clean)
      .eq("id", 1)
      .select("id");

    if (updateError) {
      setError(`Could not save. Technical detail: ${updateError.message}`);
    } else if (!data || data.length === 0) {
      setError("Could not save. You may be logged out. Please log in again.");
    } else {
      setS(clean);
      setMessage("Saved!");
    }
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      noValidate
      className="max-w-xl space-y-6"
    >
      <p className="text-sm text-gray-600">
        Customers only see a payment method if it is filled in. Leave a section
        completely empty to hide that method. Cash on Delivery is always
        available. If you fill any box in a section, all boxes in that section
        are required.
      </p>

      <div className="space-y-3 border rounded-xl p-4">
        <h2 className="font-semibold">JazzCash</h2>
        <Field
          id="jazzcash_title"
          label="Account title"
          required={jazzUsed}
          value={s.jazzcash_title}
          onChange={(v) => set("jazzcash_title", v)}
          placeholder="Name registered on the JazzCash account"
          error={errors.jazzcash_title}
        />
        <Field
          id="jazzcash_number"
          label="JazzCash number"
          required={jazzUsed}
          value={s.jazzcash_number}
          onChange={(v) => set("jazzcash_number", v)}
          placeholder="e.g. 03001234567"
          hint="11 digits, starts with 03."
          inputMode="tel"
          maxLength={16}
          error={errors.jazzcash_number}
        />
      </div>

      <div className="space-y-3 border rounded-xl p-4">
        <h2 className="font-semibold">Easypaisa</h2>
        <Field
          id="easypaisa_title"
          label="Account title"
          required={easyUsed}
          value={s.easypaisa_title}
          onChange={(v) => set("easypaisa_title", v)}
          placeholder="Name registered on the Easypaisa account"
          error={errors.easypaisa_title}
        />
        <Field
          id="easypaisa_number"
          label="Easypaisa number"
          required={easyUsed}
          value={s.easypaisa_number}
          onChange={(v) => set("easypaisa_number", v)}
          placeholder="e.g. 03001234567"
          hint="11 digits, starts with 03."
          inputMode="tel"
          maxLength={16}
          error={errors.easypaisa_number}
        />
      </div>

      <div className="space-y-3 border rounded-xl p-4">
        <h2 className="font-semibold">WhatsApp</h2>
        <Field
          id="whatsapp"
          label="WhatsApp number for payment screenshots"
          required={whatsappRequired}
          value={s.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          placeholder="e.g. 03001234567"
          hint="11 digits, starts with 03. Customers send their payment screenshots here."
          inputMode="tel"
          maxLength={16}
          error={errors.whatsapp}
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-black text-white rounded-lg px-5 py-2 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}