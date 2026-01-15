"use client";

import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-[900px] mx-auto px-12 sm:px-24 pt-24 pb-32">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--workspace-text-primary)] mb-4">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-[var(--workspace-text-secondary)]">
          Start writing or select a note from the sidebar.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          className="flex items-center gap-3 p-4 rounded-lg border border-[var(--workspace-border)] hover:bg-[var(--workspace-hover)] transition-colors text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--workspace-hover)] flex items-center justify-center group-hover:bg-[var(--workspace-active)] transition-colors">
            <span className="material-symbols-outlined text-[var(--workspace-text-secondary)]">
              add
            </span>
          </div>
          <div>
            <p className="font-medium text-[var(--workspace-text-primary)]">
              New note
            </p>
            <p className="text-sm text-[var(--workspace-text-secondary)]">
              Create a blank note
            </p>
          </div>
        </button>

        <button
          type="button"
          className="flex items-center gap-3 p-4 rounded-lg border border-[var(--workspace-border)] hover:bg-[var(--workspace-hover)] transition-colors text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--workspace-hover)] flex items-center justify-center group-hover:bg-[var(--workspace-active)] transition-colors">
            <span className="material-symbols-outlined text-[var(--workspace-text-secondary)]">
              search
            </span>
          </div>
          <div>
            <p className="font-medium text-[var(--workspace-text-primary)]">
              Search notes
            </p>
            <p className="text-sm text-[var(--workspace-text-secondary)]">
              Find your notes
            </p>
          </div>
        </button>

        <button
          type="button"
          className="flex items-center gap-3 p-4 rounded-lg border border-[var(--workspace-border)] hover:bg-[var(--workspace-hover)] transition-colors text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--workspace-hover)] flex items-center justify-center group-hover:bg-[var(--workspace-active)] transition-colors">
            <span className="material-symbols-outlined text-[var(--workspace-text-secondary)]">
              history
            </span>
          </div>
          <div>
            <p className="font-medium text-[var(--workspace-text-primary)]">
              Recent notes
            </p>
            <p className="text-sm text-[var(--workspace-text-secondary)]">
              Jump back in
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
