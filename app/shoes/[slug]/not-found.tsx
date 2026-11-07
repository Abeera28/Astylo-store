import Link from "next/link";
import SiteHeader from "../../SiteHeader";

export default function ShoeNotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="page-wrap py-20 text-center">
        <p className="eyebrow mb-2">Sorry</p>
        <h1 className="text-3xl md:text-5xl">
          This shoe is no longer available
        </h1>
        <p className="mx-auto mt-4 max-w-md text-gray-600">
          The link may be old, or the shoe may have been removed. Take a look
          at our other shoes.
        </p>
        <Link href="/#shoes" className="btn-solid mt-8">
          See all shoes
        </Link>
      </section>
    </main>
  );
}