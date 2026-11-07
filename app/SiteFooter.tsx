"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

type ShopInfo = {
  email: string;
  phone: string;
  address: string;
  map_url: string;
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 4)} ${digits.slice(4)}`
    : phone;
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return /^03\d{9}$/.test(digits) ? `https://wa.me/92${digits.slice(1)}` : null;
}

export default function SiteFooter() {
  const [info, setInfo] = useState<ShopInfo | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("shop_info")
      .select("email, phone, address, map_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setInfo(data as ShopInfo);
      });
  }, []);

  const hasContact = Boolean(
    info && (info.email || info.phone || info.address || info.map_url)
  );

  const mapLink = info?.map_url
    ? info.map_url
    : info?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        info.address
      )}`
    : "";

  const wa = info?.phone ? whatsappLink(info.phone) : null;

  return (
    <footer className="site-footer mt-10">
      <div className="page-wrap py-10 md:py-14">
        <div
          className={`grid gap-8 ${
            hasContact
              ? "md:grid-cols-[1.4fr_1fr_1fr_1.5fr]"
              : "md:grid-cols-[1.5fr_1fr_1fr]"
          }`}
        >
          <div>
            <p className="font-serif text-3xl md:text-4xl">
              Astylo<span className="text-[#e0a5a0]">.</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-[#d9c7c0]">
              Ladies shoes and heels, made for every step.
            </p>
          </div>

          <div>
            <p className="footer-title">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#shoes" className="hover:underline">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:underline">
                  My orders
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:underline">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-title">Good to know</p>
            <ul className="mt-3 space-y-2 text-sm text-[#d9c7c0]">
              <li>Cash on Delivery available</li>
              <li>Track your order in My orders</li>
            </ul>
          </div>

          {hasContact && info && (
            <div>
              <p className="footer-title">Visit &amp; contact</p>
              <ul className="mt-3 space-y-3 text-sm">
                {(info.address || mapLink) && (
                  <li>
                    {info.address && (
                      <p className="text-[#d9c7c0]">{info.address}</p>
                    )}
                    {mapLink && (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block font-semibold underline"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </li>
                )}
                {info.phone && (
                  <li>
                    <a href={`tel:${info.phone}`} className="hover:underline">
                      Call {formatPhone(info.phone)}
                    </a>
                    {wa && (
                      <>
                        {" · "}
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                  </li>
                )}
                {info.email && (
                  <li>
                    <a
                      href={`mailto:${info.email}`}
                      className="break-all hover:underline"
                    >
                      {info.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-[#bfa9a3]">
          © Astylo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}