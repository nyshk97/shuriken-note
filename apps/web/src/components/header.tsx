"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="text-lg font-semibold">Shuriken Note</h1>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </Button>
        </div>
      </div>
    </header>
  );
}
