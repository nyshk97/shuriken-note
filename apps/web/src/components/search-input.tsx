"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("q", next);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.replace(`/articles?${params.toString()}`);
    }, 300);
  }

  return (
    <input
      key={searchParams.get("q") ?? ""}
      type="search"
      defaultValue={searchParams.get("q") ?? ""}
      onChange={handleChange}
      placeholder="Search articles..."
      className="w-full max-w-48 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
    />
  );
}
