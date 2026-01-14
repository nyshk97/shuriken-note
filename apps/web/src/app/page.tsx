"use client";

import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold">Shuriken Note</h1>
        {user ? (
          <p className="mt-4 text-lg text-muted-foreground">
            ようこそ、{user.email} さん
          </p>
        ) : (
          <p className="mt-4 text-lg text-muted-foreground">Coming soon...</p>
        )}
      </main>
    </div>
  );
}
