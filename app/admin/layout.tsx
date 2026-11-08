import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "./AdminShell";

export const metadata: Metadata = {
  title: "Admin | Astylo",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}