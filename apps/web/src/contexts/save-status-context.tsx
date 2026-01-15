"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AutoSaveStatus } from "@/hooks/use-auto-save";

interface SaveStatusContextType {
  status: AutoSaveStatus;
  setStatus: (status: AutoSaveStatus) => void;
}

const SaveStatusContext = createContext<SaveStatusContextType | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");

  return (
    <SaveStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  const context = useContext(SaveStatusContext);
  if (!context) {
    throw new Error("useSaveStatus must be used within a SaveStatusProvider");
  }
  return context;
}
