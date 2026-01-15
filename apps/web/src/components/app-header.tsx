"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  return (
    <header className="h-[45px] flex items-center justify-between px-3 flex-shrink-0 bg-[var(--workspace-bg)] z-10">
      {/* Left side - breadcrumb area */}
      <div className="flex items-center gap-1 text-sm truncate">
        {/* Sidebar toggle button */}
        <button
          type="button"
          className="flex items-center gap-1 p-1 hover:bg-[var(--workspace-hover)] rounded cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined icon-sm text-[var(--workspace-text-secondary)]">
            menu_open
          </span>
        </button>

        {/* App title / breadcrumb */}
        <div className="flex items-center gap-1 ml-1 text-[var(--workspace-text-primary)]">
          <span className="flex items-center gap-1.5 p-1 hover:bg-[var(--workspace-hover)] rounded cursor-pointer transition-colors">
            <span className="material-symbols-outlined icon-sm text-[var(--workspace-text-secondary)]">
              edit_note
            </span>
            <span className="truncate font-medium">Shuriken Note</span>
          </span>
        </div>
      </div>

      {/* Right side - user menu */}
      <div className="flex items-center gap-1 text-[var(--workspace-text-secondary)] text-xs relative">
        {/* User menu button */}
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

        {/* More options button */}
        <button
          type="button"
          className="p-1 hover:bg-[var(--workspace-hover)] rounded transition-colors"
        >
          <span className="material-symbols-outlined icon-sm">more_horiz</span>
        </button>
      </div>
    </header>
  );
}
