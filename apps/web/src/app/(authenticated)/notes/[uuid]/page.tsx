"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Globe, Archive } from "lucide-react";
import { getNote, getNotes, updateNote, type Note } from "@/lib/api";
import { VditorEditor } from "@/components/editor";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useSaveStatus } from "@/contexts/save-status-context";
import { useCreateNote } from "@/hooks/use-create-note";

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
  const createNoteMutation = useCreateNote();

  // Initialize with note values - this runs once per mount
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  // Fetch child notes if this is a parent note (no parent_note_id)
  const { data: allNotes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes({ sort: "-updated_at" }),
  });

  // Filter children of this note
  const childNotes = useMemo(
    () => allNotes.filter((n) => n.parent_note_id === note.id),
    [allNotes, note.id]
  );

  // Can add child if: not archived and not already a child note
  const canAddChild = note.effective_status !== "archived" && !note.parent_note_id;

  const handleAddChild = () => {
    createNoteMutation.mutate({
      status: note.effective_status === "published" ? "published" : "personal",
      parent_note_id: note.id,
    });
  };

  // Track newly uploaded files that need to be attached to this note
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>([]);

  // Handle new file upload
  const handleFileUploaded = (signedId: string) => {
    setPendingAttachmentIds((prev) => [...prev, signedId]);
  };

  // Memoize data objects for auto-save comparison
  const currentData = useMemo(
    () => ({ title, body, attachment_ids: pendingAttachmentIds }),
    [title, body, pendingAttachmentIds]
  );
  const originalData = useMemo(
    () => ({ title: note.title, body: note.body, attachment_ids: [] as string[] }),
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
      // Clear pending attachments after successful save
      if (data.attachment_ids && data.attachment_ids.length > 0) {
        setPendingAttachmentIds([]);
      }
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
          onFileUploaded={handleFileUploaded}
        />
      </div>

      {/* Shortcut hint */}
      <div className="py-2 text-xs text-[var(--workspace-text-tertiary)]">
        <kbd className="px-1.5 py-0.5 rounded bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)]">
          {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
        </kbd>
        <span className="mx-1">+</span>
        <kbd className="px-1.5 py-0.5 rounded bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)]">
          /
        </kbd>
        <span className="ml-2">for formatting toolbar</span>
      </div>

      {/* Child notes section - only show for parent notes */}
      {canAddChild && (
        <div className="mt-8 pt-6 border-t border-[var(--workspace-border)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--workspace-text-secondary)]">
              Child notes
            </h3>
            <button
              type="button"
              onClick={handleAddChild}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded transition-colors"
            >
              <Plus size={14} />
              Add child
            </button>
          </div>
          {childNotes.length > 0 ? (
            <div className="space-y-1">
              {childNotes.map((child) => (
                <ChildNoteItem key={child.id} note={child} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--workspace-text-tertiary)]">
              No child notes yet. Click &quot;Add child&quot; to create one.
            </p>
          )}
        </div>
      )}

      {/* Error display */}
      {saveError && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 text-red-500 text-sm">
          Failed to save. Please try again.
        </div>
      )}
    </div>
  );
}

// Child note item component
function ChildNoteItem({ note }: { note: Note }) {
  const getIcon = () => {
    if (note.effective_status === "published") return <Globe size={16} />;
    if (note.effective_status === "archived") return <Archive size={16} />;
    return <FileText size={16} />;
  };

  return (
    <Link
      href={`/notes/${note.id}`}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-[var(--workspace-hover)]/50 hover:bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)] transition-colors"
    >
      {getIcon()}
      <span className="truncate">{note.title || "Untitled"}</span>
    </Link>
  );
}
