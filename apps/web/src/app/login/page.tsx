"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ApiClientError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{
        backgroundColor: "#0f0f0f",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <div className="flex-grow flex items-center justify-center p-6">
        <main className="w-full max-w-[320px]">
          {/* Header */}
          <div className="flex flex-col items-center mb-24 text-center">
            <h1
              className="text-5xl font-normal tracking-tight text-white italic"
              style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
            >
              Shuriken Note
            </h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#707070] font-light mt-6">
              Personal Workspace
            </p>
          </div>

          {/* Form */}
          <div className="space-y-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="text-sm text-red-400 text-center py-2">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
                  className="login-input w-full"
                />
              </div>

              <div className="space-y-1">
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  className="login-input w-full"
                />
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="login-button w-full flex items-center justify-center"
                >
                  {isSubmitting ? "Unlocking..." : "Unlock"}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-center pt-16 opacity-20">
              <p className="text-[9px] tracking-[0.2em] font-light text-white">
                PRIVATE INSTANCE
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
