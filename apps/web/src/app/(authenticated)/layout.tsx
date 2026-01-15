"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";
import { SaveStatusProvider } from "@/contexts/save-status-context";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--workspace-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--workspace-text-secondary)] border-t-[var(--workspace-accent)]" />
          <p className="text-sm text-[var(--workspace-text-secondary)]">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <SaveStatusProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--workspace-bg)] text-[var(--workspace-text-primary)] font-[var(--font-inter)] antialiased selection:bg-[var(--workspace-accent)] selection:text-white">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} />

        {/* Main content area */}
        <main className="flex flex-1 flex-col h-full relative">
          <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
          <div className="flex-1 overflow-y-auto workspace-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </SaveStatusProvider>
  );
}
