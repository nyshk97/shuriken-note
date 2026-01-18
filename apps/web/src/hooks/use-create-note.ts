"use client";

import { useRouter } from "next/navigation";
import type { Note } from "@/lib/api";

interface CreateNoteOptions {
  status?: Note["status"];
  parent_note_id?: string;
}

export function useCreateNote() {
  const router = useRouter();

  return {
    mutate: (statusOrOptions?: Note["status"] | CreateNoteOptions) => {
      // Support both old signature (status) and new signature (options object)
      const options: CreateNoteOptions =
        typeof statusOrOptions === "string"
          ? { status: statusOrOptions }
          : statusOrOptions || {};

      const params = new URLSearchParams();
      if (options.status) params.set("status", options.status);
      if (options.parent_note_id) params.set("parent", options.parent_note_id);

      const query = params.toString();
      router.push(`/notes/new${query ? `?${query}` : ""}`);
    },
    isPending: false,
  };
}
