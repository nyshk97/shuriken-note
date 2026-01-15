"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createNote, type Note } from "@/lib/api";

export function useCreateNote() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status?: Note["status"]) => createNote({ status }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push(`/notes/${note.id}`);
    },
  });
}
