"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNote, updateNote, deleteNote, type Note } from "@/lib/api";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const {
    data: note,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["note", uuid],
    queryFn: () => getNote(uuid),
    enabled: !!uuid,
  });

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

  if (error || !note) {
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

  // Use key to remount editor when note changes
  return <NoteEditor key={note.id} note={note} />;
}

function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Initialize with note values - this runs once per mount
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  // Calculate hasChanges with useMemo instead of useEffect + setState
  const hasChanges = useMemo(() => {
    return title !== note.title || body !== note.body;
  }, [title, body, note.title, note.body]);

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; body: string }) =>
      updateNote(note.id, data),
    onSuccess: (updatedNote) => {
      // Update cache
      queryClient.setQueryData(["note", note.id], updatedNote);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
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
