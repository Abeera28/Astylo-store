"use client";

import { useState } from "react";
import {
  METHOD_LABELS,
  type PayMethod,
  type ShopSettings,
} from "./PaymentDetails";

function formatPhone(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 4)} ${digits.slice(4)}`
    : number;
}

export default function PaymentInstructions({
  method,
  settings,
  amount,
  orderNumber,
  customerName,
  customerPhone,
}: {
  method: PayMethod;
  settings: ShopSettings | null;
  amount: number;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!settings || (method !== "jazzcash" && method !== "easypaisa")) {
    return null;
  }

  const number =
    method === "jazzcash" ? settings.jazzcash_number : settings.easypaisa_number;
  const title =
    method === "jazzcash" ? settings.jazzcash_title : settings.easypaisa_title;
  const label = METHOD_LABELS[method];
  const amountText = `Rs. ${amount.toLocaleString("en-US")}`;

  const whatsappLocal = settings.whatsapp.startsWith("92")
    ? "0" + settings.whatsapp.slice(2)
    : settings.whatsapp;

  const who = [customerName?.trim(), customerPhone?.trim()]
    .filter(Boolean)
    .join(", ");

  const message = orderNumber
    ? `Hello, I placed order #${orderNumber} (${amountText}, paid with ${label}). Here is my payment screenshot.`
    : `Hello, I paid ${amountText} with ${label} for my Astylo order${
        who ? ` (${who})` : ""
      }. Here is my payment screenshot.`;

  const whatsappLink = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
    message
  )}`;

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border bg-white p-4 text-sm">
      <p className="text-base font-semibold">Pay with {label}</p>

      <div>
        <p className="text-gray-600">
          <strong>Step 1.</strong> Send <strong>{amountText}</strong> to this{" "}
          {label} number:
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-gray-100 px-4 py-2 font-serif text-xl tracking-wide">
            {formatPhone(number)}
          </span>
          <button
            type="button"
            onClick={copyNumber}
            className="rounded-lg border border-black px-4 py-2 font-semibold"
          >
            {copied ? "Copied ✓" : "Copy number"}
          </button>
        </div>
        {title && (
          <p className="mt-1 text-gray-600">
            Account title: <strong>{title}</strong>
          </p>
        )}
      </div>

      <div>
        <p className="text-gray-600">
          <strong>Step 2.</strong> After paying, tap the green button. It opens
          the shop&apos;s WhatsApp chat with your message already typed. You
          only attach your payment screenshot and send.
        </p>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-green-600 px-6 py-3 text-base font-semibold text-white sm:inline-flex sm:w-auto"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z" />
          </svg>
          <span className="text-left leading-tight">
            Open WhatsApp chat
            <span className="block text-xs font-normal opacity-90">
              {formatPhone(whatsappLocal)}
            </span>
          </span>
        </a>

        <p className="mt-2 text-xs text-gray-500">
          In WhatsApp, tap the paperclip, choose your screenshot, and press
          send.
          {orderNumber
            ? " Your order number is already in the message."
            : " You can also do this right after placing your order."}
        </p>
      </div>
    </div>
  );
}