"use client";

import { useRef, useState } from "react";

export default function PrintButton({ orderText }: { orderText: string }) {
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // mark only this order for printing; the CSS hides all other orders
    const area = wrapRef.current?.closest(".print-area");
    area?.classList.add("is-printing");

    const cleanup = () => {
      area?.classList.remove("is-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy text.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Astylo Order Details", text: orderText });
      } catch {
        /* user closed the share sheet */
      }
    } else {
      // desktop fallback: open WhatsApp with the order text
      window.open(`https://wa.me/?text=${encodeURIComponent(orderText)}`, "_blank");
    }
  };

  return (
    <div ref={wrapRef} className="no-print w-full space-y-2">
      <button
        onClick={handlePrint}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-full text-base font-bold shadow-lg ring-2 ring-rose-300 hover:bg-rose-700 transition"
      >
        🖨️ Print Receipt
      </button>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 sm:flex-none px-5 py-2.5 border border-black rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
        >
          {copied ? "✅ Copied!" : "📋 Copy Details"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 sm:flex-none px-5 py-2.5 border border-black rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
        >
          🔗 Share
        </button>
      </div>
    </div>
  );
}