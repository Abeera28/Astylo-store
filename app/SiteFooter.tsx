import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer mt-10">
      <div className="page-wrap py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
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
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-[#bfa9a3]">
          © Astylo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}