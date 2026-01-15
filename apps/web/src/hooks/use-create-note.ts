"use client";

import { useRouter } from "next/navigation";
import type { Note } from "@/lib/api";

export function useCreateNote() {
  const router = useRouter();

  return {
    mutate: (status?: Note["status"]) => {
      // Navigate to new note page with optional status
      const params = status ? `?status=${status}` : "";
      router.push(`/notes/new${params}`);
    },
    isPending: false,
  };
}
