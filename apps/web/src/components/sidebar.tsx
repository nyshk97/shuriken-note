"use client";

import { useAuth } from "@/hooks/use-auth";

// Note: This is a placeholder sidebar component.
// Full sidebar functionality (note list, search, etc.) will be implemented in a future issue.

export function Sidebar() {
  const { user } = useAuth();

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

      {/* Notes section - placeholder */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 workspace-scrollbar">
        <div>
          <div className="px-3 py-1 text-xs font-semibold text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer flex items-center justify-between group/header">
            <span>Private</span>
          </div>
          <div className="mt-0.5 space-y-0.5">
            {/* Placeholder items - will be replaced with actual notes */}
            <div className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer">
              <span className="material-symbols-outlined icon-sm">
                description
              </span>
              <span className="truncate">No notes yet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - New page button */}
      <div className="p-2 border-t border-[var(--workspace-border)] mt-auto">
        <button
          type="button"
          className="w-full flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined icon-sm">add</span>
          <span>New page</span>
        </button>
      </div>
    </aside>
  );
}
