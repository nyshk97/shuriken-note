"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getNote, updateNote, deleteNote, type Note } from "@/lib/api";
import { useSaveStatus } from "@/contexts/save-status-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

// Status display labels
const statusLabels: Record<Note["status"], string> = {
  personal: "Private",
  published: "Public",
  archived: "Archived",
};

export function AppHeader({ sidebarOpen, onToggleSidebar }: AppHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { status: saveStatus } = useSaveStatus();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get note ID from URL if on a note page
  const noteId = params?.uuid as string | undefined;
  const isNotePage = pathname?.startsWith("/notes/") && noteId && noteId !== "new";

  // Fetch note data
  const { data: note } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNote(noteId!),
    enabled: !!isNotePage,
  });

  // Update note status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: Note["status"]) => updateNote(noteId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(noteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push("/");
    },
  });

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
    }
  }

  function handleStatusChange(status: Note["status"]) {
    updateStatusMutation.mutate(status);
  }

  function handleDelete() {
    if (confirm("このノートを削除しますか？")) {
      deleteMutation.mutate();
    }
  }

  return (
    <header className="h-[45px] flex items-center justify-between px-3 flex-shrink-0 bg-[var(--workspace-bg)] z-10">
      {/* Left side */}
      <div className="flex items-center gap-2 text-sm truncate">
        {/* Sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center p-1 hover:bg-[var(--workspace-hover)] rounded cursor-pointer transition-colors"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <span className="material-symbols-outlined icon-sm text-[var(--workspace-text-secondary)]">
            {sidebarOpen ? "menu_open" : "menu"}
          </span>
        </button>

        {/* Note info (only shown on note pages) */}
        {isNotePage && note && (
          <>
            {/* Note title */}
            <span className="truncate font-medium text-[var(--workspace-text-primary)] max-w-[200px]">
              {note.title || "Untitled"}
            </span>

            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-0.5 text-xs text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded transition-colors">
                  <span className="material-symbols-outlined icon-xs">
                    {note.status === "published" ? "public" : "lock"}
                  </span>
                  <span>{statusLabels[note.status]}</span>
                  <span className="material-symbols-outlined icon-xs">
                    expand_more
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleStatusChange("personal")}
                  className={note.status === "personal" ? "bg-[var(--workspace-hover)]" : ""}
                >
                  <span className="material-symbols-outlined icon-sm mr-2">lock</span>
                  Private
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("published")}
                  className={note.status === "published" ? "bg-[var(--workspace-hover)]" : ""}
                >
                  <span className="material-symbols-outlined icon-sm mr-2">public</span>
                  Public
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("archived")}
                  className={note.status === "archived" ? "bg-[var(--workspace-hover)]" : ""}
                >
                  <span className="material-symbols-outlined icon-sm mr-2">inventory_2</span>
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 text-[var(--workspace-text-secondary)] text-xs">
        {/* Note actions (only shown on note pages) */}
        {isNotePage && note && (
          <>
            {/* Save status */}
            <SaveStatusDisplay status={saveStatus} />

            {/* Updated time */}
            <span className="text-[var(--workspace-text-tertiary)] mr-2">
              Edited {formatRelativeTime(note.updated_at)}
            </span>

            {/* Star button (placeholder) */}
            <button
              type="button"
              className="p-1 hover:bg-[var(--workspace-hover)] rounded transition-colors"
              title="Add to favorites"
            >
              <span className="material-symbols-outlined icon-sm">star_outline</span>
            </button>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 hover:bg-[var(--workspace-hover)] rounded transition-colors"
                >
                  <span className="material-symbols-outlined icon-sm">more_horiz</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-400 focus:text-red-400"
                >
                  <span className="material-symbols-outlined icon-sm mr-2">delete</span>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* User menu button */}
        <div className="relative ml-2">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-[var(--workspace-hover)] rounded transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--workspace-accent)] flex items-center justify-center text-white text-xs font-medium">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block max-w-[120px] truncate">
              {user?.email}
            </span>
            <span className="material-symbols-outlined icon-xs">expand_more</span>
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--workspace-sidebar)] border border-[var(--workspace-border)] rounded-md shadow-lg z-20 py-1">
                {/* User info */}
                <div className="px-3 py-2 border-b border-[var(--workspace-border)]">
                  <p className="text-sm font-medium text-[var(--workspace-text-primary)] truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] hover:text-[var(--workspace-text-primary)] transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined icon-sm">
                      logout
                    </span>
                    <span>{isLoggingOut ? "ログアウト中..." : "ログアウト"}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Save status display component */
function SaveStatusDisplay({ status }: { status: string }) {
  switch (status) {
    case "saving":
      return (
        <div className="flex items-center gap-1 text-[var(--workspace-text-secondary)] mr-3">
          <div className="h-3 w-3 animate-spin rounded-full border border-[var(--workspace-text-secondary)] border-t-transparent" />
          <span>Saving...</span>
        </div>
      );
    case "saved":
      return (
        <span className="text-[var(--workspace-text-tertiary)] mr-3">
          Saved
        </span>
      );
    case "error":
      return (
        <span className="text-red-500 mr-3">
          Save failed
        </span>
      );
    case "pending":
      return (
        <span className="text-[var(--workspace-text-tertiary)] mr-3">
          Editing...
        </span>
      );
    default:
      return null;
  }
}
