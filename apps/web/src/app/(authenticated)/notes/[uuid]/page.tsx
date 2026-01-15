"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNote, updateNote, deleteNote } from "@/lib/api";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const uuid = params.uuid as string;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const {
    data: note,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["note", uuid],
    queryFn: () => getNote(uuid),
    enabled: !!uuid,
  });

  // Sync local state with fetched note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setHasChanges(false);
    }
  }, [note]);

  // Track changes
  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const bodyChanged = body !== note.body;
      setHasChanges(titleChanged || bodyChanged);
    }
  }, [title, body, note]);

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; body: string }) =>
      updateNote(uuid, data),
    onSuccess: (updatedNote) => {
      // Update cache
      queryClient.setQueryData(["note", uuid], updatedNote);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setHasChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push("/");
    },
  });

  const handleSave = useCallback(() => {
    if (!hasChanges) return;
    updateMutation.mutate({ title, body });
  }, [hasChanges, title, body, updateMutation]);

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteMutation.mutate();
    }
  }, [deleteMutation]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--workspace-text-secondary)] border-t-[var(--workspace-accent)]" />
          <p className="text-sm text-[var(--workspace-text-secondary)]">
            Loading note...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--workspace-text-primary)] mb-2">
            Note not found
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-[var(--workspace-accent)] hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-12 sm:px-24 pt-12 pb-32 h-full flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-[var(--workspace-text-secondary)]">
          {hasChanges ? (
            <span className="text-[var(--workspace-accent)]">
              Unsaved changes
            </span>
          ) : (
            <span>Saved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="px-4 py-1.5 text-sm font-medium rounded-md bg-[var(--workspace-accent)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-1.5 text-sm font-medium rounded-md text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="w-full text-4xl font-bold bg-transparent border-none outline-none text-[var(--workspace-text-primary)] placeholder:text-[var(--workspace-text-tertiary)] mb-6"
      />

      {/* Body textarea */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start writing..."
        className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[var(--workspace-text-primary)] placeholder:text-[var(--workspace-text-tertiary)] leading-relaxed"
      />

      {/* Error display */}
      {updateMutation.isError && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 text-red-500 text-sm">
          Failed to save. Please try again.
        </div>
      )}
      {deleteMutation.isError && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 text-red-500 text-sm">
          Failed to delete. Please try again.
        </div>
      )}
    </div>
  );
}
