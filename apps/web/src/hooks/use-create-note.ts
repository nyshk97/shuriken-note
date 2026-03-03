"use client";

import { useRouter } from "next/navigation";
import type { NoteVisibility } from "@/lib/api";

interface CreateNoteOptions {
  visibility?: NoteVisibility;
  parent_note_id?: string;
}

export function useCreateNote() {
  const router = useRouter();

  return {
    mutate: (visibilityOrOptions?: NoteVisibility | CreateNoteOptions) => {
      const options: CreateNoteOptions =
        typeof visibilityOrOptions === "string"
          ? { visibility: visibilityOrOptions }
          : visibilityOrOptions || {};

      const params = new URLSearchParams();
      if (options.visibility) params.set("visibility", options.visibility);
      if (options.parent_note_id) params.set("parent", options.parent_note_id);

      const query = params.toString();
      router.push(`/notes/new${query ? `?${query}` : ""}`);
    },
    isPending: false,
  };
}
