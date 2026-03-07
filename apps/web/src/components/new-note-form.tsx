"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNote, type Note } from "@/lib/api";
import { VditorEditor } from "@/components/editor";

export function NewNoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const initialVisibility = (searchParams.get("visibility") as Note["visibility"]) || "personal";
  const parentNoteId = searchParams.get("parent") || undefined;

  const hasContent = useMemo(
    () => title.trim() !== "" || body.trim() !== "",
    [title, body]
  );

  const createTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createNote({
        title: title.trim(),
        body: body.trim(),
        visibility: initialVisibility,
        parent_note_id: parentNoteId,
      }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.replace(`/notes/${note.id}`);
    },
    onError: () => {
      setIsCreating(false);
    },
  });

  useEffect(() => {
    if (!hasContent || isCreating || createMutation.isPending) {
      return;
    }

    if (createTimerRef.current) {
      clearTimeout(createTimerRef.current);
    }

    createTimerRef.current = setTimeout(() => {
      setIsCreating(true);
      createMutation.mutate();
    }, 500);

    return () => {
      if (createTimerRef.current) {
        clearTimeout(createTimerRef.current);
      }
    };
  }, [hasContent, isCreating, createMutation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasContent && !isCreating && !createMutation.isPending) {
          if (createTimerRef.current) {
            clearTimeout(createTimerRef.current);
          }
          setIsCreating(true);
          createMutation.mutate();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasContent, isCreating, createMutation]);

  return (
    <div className="max-w-[900px] mx-auto px-12 sm:px-24 pt-12 h-full flex flex-col">
      <div className="mb-6">
        <div className="text-sm text-[var(--workspace-text-tertiary)]">
          {isCreating || createMutation.isPending ? "Creating..." : "New note"}
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        autoFocus
        className="w-full text-4xl font-bold bg-transparent border-none outline-none text-[var(--workspace-text-primary)] placeholder:text-[var(--workspace-text-tertiary)] mb-6"
      />

      <div className="flex-1 min-h-0">
        <VditorEditor
          value={body}
          onChange={setBody}
          placeholder="Start writing..."
          className="note-editor"
        />
      </div>

      {createMutation.isError && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 text-red-500 text-sm">
          Failed to create note. Please try again.
        </div>
      )}
    </div>
  );
}
