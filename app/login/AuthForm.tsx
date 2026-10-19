"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();

  const requested = params.get("next") ?? "/";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup" && !fullName.trim()) {
      return setError("Please enter your name.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError(
          "Account created, but you could not be logged in automatically. Please log in."
        );
        setMode("login");
        setLoading(false);
        return;
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError("Wrong email or password.");
        setLoading(false);
        return;
      }
    }

    router.push(next);
    router.refresh();
    setLoading(false);
  }

  return (
    <section className="flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border rounded-xl p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>

        {next !== "/" && (
          <p className="text-sm text-gray-600">
            {mode === "login"
              ? "Log in to continue with your order."
              : "Create an account to place your order. Your cart will be waiting."}
          </p>
        )}

        {mode === "signup" && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="Full name"
            className="w-full border rounded-lg p-2 text-black bg-white"
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="Email"
          required
          className="w-full border rounded-lg p-2 text-black bg-white"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Password (at least 6 characters)"
          required
          className="w-full border rounded-lg p-2 text-black bg-white"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg p-2 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Log in"
            : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          className="w-full text-sm underline"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>
      </form>
    </section>
  );
}