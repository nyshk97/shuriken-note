"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PanelLeftClose,
  PanelLeft,
  Globe,
  Lock,
  Archive,
  ChevronDown,
  Star,
  MoreHorizontal,
  Trash2,
  LogOut,
  ExternalLink,
  FilePlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateNote } from "@/hooks/use-create-note";
import { getNote, updateNote, deleteNote, type Note } from "@/lib/api";
import { DEFAULT_LANDING_PATH } from "@/lib/constants";
import { useSaveStatus } from "@/contexts/save-status-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const createNoteMutation = useCreateNote();
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
      router.push(DEFAULT_LANDING_PATH);
    },
  });

  // Favorite toggle mutation
  const favoriteMutation = useMutation({
    mutationFn: (favorited: boolean) =>
      updateNote(noteId!, { favorited_at: favorited ? new Date().toISOString() : null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const isFavorited = !!note?.favorited_at;

  function handleToggleFavorite() {
    favoriteMutation.mutate(!isFavorited);
  }

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
          className="flex items-center p-1 hover:bg-[var(--workspace-hover)] rounded cursor-pointer transition-colors text-[var(--workspace-text-secondary)]"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
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
                  {note.status === "published" ? <Globe size={14} /> : <Lock size={14} />}
                  <span>{statusLabels[note.status]}</span>
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleStatusChange("personal")}
                  className={note.status === "personal" ? "bg-[var(--workspace-hover)]" : ""}
                >
                  <Lock size={16} className="mr-2" />
                  Private
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("published")}
                  className={note.status === "published" ? "bg-[var(--workspace-hover)]" : ""}
                >
                  <Globe size={16} className="mr-2" />
                  Public
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("archived")}
                  className={note.status === "archived" ? "bg-[var(--workspace-hover)]" : ""}
                >
                  <Archive size={16} className="mr-2" />
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Open public page button (only for published notes) */}
            {note.status === "published" && (
              <a
                href={`/p/${note.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 text-xs text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] hover:text-[var(--workspace-text-primary)] rounded transition-colors"
                title="Open public page"
              >
                <ExternalLink size={14} />
              </a>
            )}
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

            {/* Star button - toggle favorite (not available for archived notes) */}
            {note.effective_status !== "archived" && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteMutation.isPending}
                className="p-1 hover:bg-[var(--workspace-hover)] rounded transition-colors disabled:opacity-50"
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Star
                  size={16}
                  className={isFavorited ? "fill-yellow-500 text-yellow-500" : ""}
                />
              </button>
            )}

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 hover:bg-[var(--workspace-hover)] rounded transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Add child note - only for non-child, non-archived notes */}
                {!note.parent_note_id && note.effective_status !== "archived" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => createNoteMutation.mutate({
                        status: note.effective_status === "published" ? "published" : "personal",
                        parent_note_id: note.id,
                      })}
                    >
                      <FilePlus size={16} className="mr-2" />
                      Add child note
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 size={16} className="mr-2 text-red-400" />
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
            <ChevronDown size={14} />
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
                    <LogOut size={16} />
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
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
