"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNote, updateNote, type Note } from "@/lib/api";
import { VditorEditor } from "@/components/editor";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useSaveStatus } from "@/contexts/save-status-context";

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
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();

  // Initialize with note values - this runs once per mount
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  // Memoize data objects for auto-save comparison
  const currentData = useMemo(() => ({ title, body }), [title, body]);
  const originalData = useMemo(
    () => ({ title: note.title, body: note.body }),
    [note.title, note.body]
  );

  // Auto-save hook
  const { status, hasUnsavedChanges, flush, error: saveError } = useAutoSave({
    data: currentData,
    originalData,
    onSave: async (data) => {
      const updatedNote = await updateNote(note.id, data);
      // Update cache on successful save
      queryClient.setQueryData(["note", note.id], updatedNote);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    delay: 1000,
  });

  // Sync status to context for header display
  useEffect(() => {
    setStatus(status);
  }, [status, setStatus]);

  // Reset status when unmounting
  useEffect(() => {
    return () => setStatus("idle");
  }, [setStatus]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to flush save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        flush();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flush]);

  // Page leave warning when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we need to set returnValue
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="max-w-[900px] mx-auto px-12 sm:px-24 pt-12 h-full flex flex-col">
      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="w-full text-4xl font-bold bg-transparent border-none outline-none text-[var(--workspace-text-primary)] placeholder:text-[var(--workspace-text-tertiary)] mb-6"
      />

      {/* Body editor */}
      <div className="flex-1 min-h-0">
        <VditorEditor
          value={body}
          onChange={setBody}
          placeholder="Start writing..."
          className="note-editor"
        />
      </div>

      {/* Error display */}
      {saveError && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 text-red-500 text-sm">
          Failed to save. Please try again.
        </div>
      )}
    </div>
  );
}
