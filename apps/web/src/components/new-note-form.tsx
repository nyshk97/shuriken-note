"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNote, updateNote, type Note } from "@/lib/api";
import { VditorEditor } from "@/components/editor";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useSaveStatus } from "@/contexts/save-status-context";

export function NewNoteForm() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setStatus } = useSaveStatus();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createdNote, setCreatedNote] = useState<Note | null>(null);
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>(
    []
  );

  const initialVisibility =
    (searchParams.get("visibility") as Note["visibility"]) || "personal";
  const parentNoteId = searchParams.get("parent") || undefined;

  const hasContent = useMemo(
    () => title.trim() !== "" || body.trim() !== "",
    [title, body]
  );

  const createTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
  });

  // Phase 1: Create note on first content input
  const createMutation = useMutation({
    mutationFn: () =>
      createNote({
        title: titleRef.current.trim(),
        body: bodyRef.current.trim(),
        visibility: initialVisibility,
        parent_note_id: parentNoteId,
      }),
    onSuccess: (note) => {
      setCreatedNote(note);
      queryClient.setQueryData(["note", note.id], note);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      window.history.replaceState(null, "", `/notes/${note.id}`);
    },
  });

  useEffect(() => {
    if (!hasContent || createdNote || createMutation.isPending) {
      return;
    }

    if (createTimerRef.current) {
      clearTimeout(createTimerRef.current);
    }

    createTimerRef.current = setTimeout(() => {
      createMutation.mutate();
    }, 500);

    return () => {
      if (createTimerRef.current) {
        clearTimeout(createTimerRef.current);
      }
    };
  }, [hasContent, createdNote, createMutation]);

  // Phase 2: Auto-save after note creation
  const currentData = useMemo(
    () => ({ title, body, attachment_ids: pendingAttachmentIds }),
    [title, body, pendingAttachmentIds]
  );
  const originalData = useMemo(
    () => ({
      title: createdNote?.title ?? "",
      body: createdNote?.body ?? "",
      attachment_ids: [] as string[],
    }),
    [createdNote?.title, createdNote?.body]
  );

  const {
    status: autoSaveStatus,
    hasUnsavedChanges,
    flush,
  } = useAutoSave({
    data: currentData,
    originalData,
    onSave: async (data) => {
      if (!createdNote) return;
      const updated = await updateNote(createdNote.id, data);
      queryClient.setQueryData(["note", createdNote.id], updated);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (data.attachment_ids && data.attachment_ids.length > 0) {
        setPendingAttachmentIds([]);
      }
    },
    delay: 1000,
    shouldSkipSave: () => !createdNote,
  });

  useEffect(() => {
    if (createdNote) setStatus(autoSaveStatus);
  }, [autoSaveStatus, setStatus, createdNote]);

  useEffect(() => {
    return () => setStatus("idle");
  }, [setStatus]);

  // Cmd/Ctrl+S: flush auto-save or trigger immediate creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (createdNote) {
          flush();
        } else if (hasContent && !createMutation.isPending) {
          if (createTimerRef.current) {
            clearTimeout(createTimerRef.current);
          }
          createMutation.mutate();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasContent, createdNote, createMutation, flush]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFileUploaded = useCallback((signedId: string) => {
    setPendingAttachmentIds((prev) => [...prev, signedId]);
  }, []);

  const statusLabel = createMutation.isPending
    ? "Creating..."
    : createdNote
      ? autoSaveStatus === "saving"
        ? "Saving..."
        : autoSaveStatus === "saved"
          ? "Saved"
          : ""
      : "New note";

  return (
    <div className="max-w-[900px] mx-auto px-12 sm:px-24 pt-12 h-full flex flex-col">
      <div className="mb-6">
        <div className="text-sm text-[var(--workspace-text-tertiary)]">
          {statusLabel}
          {!statusLabel && "\u00A0"}
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
          onFileUploaded={createdNote ? handleFileUploaded : undefined}
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
