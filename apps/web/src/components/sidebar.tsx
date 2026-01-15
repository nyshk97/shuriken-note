"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCreateNote } from "@/hooks/use-create-note";
import { getNotes, updateNote, deleteNote, type Note } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NoteSection = {
  key: Note["status"];
  label: string;
  notes: Note[];
};

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const createNoteMutation = useCreateNote();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes({ sort: "-updated_at" }),
  });

  // Group notes by status
  const sections: NoteSection[] = [
    {
      key: "personal",
      label: "Private",
      notes: notes.filter((n) => n.status === "personal"),
    },
    {
      key: "published",
      label: "Public",
      notes: notes.filter((n) => n.status === "published"),
    },
    {
      key: "archived",
      label: "Archived",
      notes: notes.filter((n) => n.status === "archived"),
    },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col bg-[var(--workspace-sidebar)] border-r border-[var(--workspace-border)] h-full transition-colors duration-200 group/sidebar">
      {/* Workspace header */}
      <div className="px-3 py-3 h-[45px] flex items-center justify-between cursor-pointer hover:bg-[var(--workspace-hover)] transition-colors m-1 rounded">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-[var(--workspace-accent)] flex items-center justify-center text-xs font-medium text-white">
            {user?.email?.charAt(0).toUpperCase() || "S"}
          </div>
          <span className="truncate text-sm font-medium">Shuriken Note</span>
          <span className="material-symbols-outlined icon-xs text-[var(--workspace-text-secondary)]">
            expand_more
          </span>
        </div>
        <div className="hidden group-hover/sidebar:flex text-[var(--workspace-text-secondary)]">
          <span className="material-symbols-outlined icon-sm">edit_square</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-2 flex flex-col gap-0.5 mb-4">
        <div className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer">
          <span className="material-symbols-outlined icon-sm">search</span>
          <span>Search</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer">
          <span className="material-symbols-outlined icon-sm">settings</span>
          <span>Settings</span>
        </div>
      </div>

      {/* Notes sections */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 workspace-scrollbar">
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-[var(--workspace-text-secondary)]">
            Loading...
          </div>
        ) : (
          sections.map((section) => (
            <NoteSection
              key={section.key}
              label={section.label}
              notes={section.notes}
              currentPath={pathname}
            />
          ))
        )}
      </div>

      {/* Footer - New page button */}
      <div className="p-2 border-t border-[var(--workspace-border)] mt-auto">
        <button
          type="button"
          onClick={() => createNoteMutation.mutate()}
          disabled={createNoteMutation.isPending}
          className="w-full flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined icon-sm">add</span>
          <span>{createNoteMutation.isPending ? "Creating..." : "New page"}</span>
        </button>
      </div>
    </aside>
  );
}

function NoteSection({
  label,
  notes,
  currentPath,
}: {
  label: string;
  notes: Note[];
  currentPath: string;
}) {
  return (
    <div>
      <div className="px-3 py-1 text-xs font-semibold text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer flex items-center justify-between group/header">
        <span>{label}</span>
      </div>
      <div className="mt-0.5 space-y-0.5">
        {notes.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-tertiary)] italic">
            <span className="material-symbols-outlined icon-sm">
              description
            </span>
            <span className="truncate">No notes</span>
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={currentPath === `/notes/${note.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NoteItem({ note, isActive }: { note: Note; isActive: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      // If we're on the deleted note's page, navigate home
      if (isActive) {
        router.push("/");
      }
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      updateNote(note.id, {
        status: note.status === "archived" ? "personal" : "archived",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", note.id] });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      deleteMutation.mutate();
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    archiveMutation.mutate();
  };

  return (
    <div className="group/item relative">
      <Link
        href={`/notes/${note.id}`}
        className={`flex items-center gap-2 px-3 py-1 text-sm rounded cursor-pointer transition-colors ${isActive
            ? "bg-[var(--workspace-active)] text-[var(--workspace-text-primary)]"
            : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)]"
          }`}
      >
        <span className="material-symbols-outlined icon-sm">description</span>
        <span className="truncate flex-1">{note.title || "Untitled"}</span>
      </Link>

      {/* Context menu trigger */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--workspace-hover)] transition-opacity ${menuOpen
                ? "opacity-100"
                : "opacity-0 group-hover/item:opacity-100"
              }`}
          >
            <span className="material-symbols-outlined icon-sm text-[var(--workspace-text-secondary)]">
              more_horiz
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="right"
          className="w-48 bg-[var(--workspace-sidebar)] border-[var(--workspace-border)]"
        >
          <DropdownMenuItem
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="text-[var(--workspace-text-secondary)] focus:bg-[var(--workspace-hover)] focus:text-[var(--workspace-text-primary)] cursor-pointer"
          >
            <span className="material-symbols-outlined icon-sm mr-2">
              {note.status === "archived" ? "unarchive" : "archive"}
            </span>
            {note.status === "archived" ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--workspace-border)]" />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
          >
            <span className="material-symbols-outlined icon-sm mr-2">
              delete
            </span>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
