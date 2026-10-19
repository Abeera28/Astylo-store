import { Suspense } from "react";
import SiteHeader from "../SiteHeader";
import AuthForm from "./AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={<p className="p-6">Loading...</p>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}