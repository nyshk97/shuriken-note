"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Globe, Archive, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getNotes, type Note } from "@/lib/api";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      // Small delay to ensure dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const notes = await getNotes({ q: query, sort: "-updated_at" });
        setResults(notes);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (note: Note) => {
      onOpenChange(false);
      router.push(`/notes/${note.id}`);
    },
    [router, onOpenChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    },
    [results, selectedIndex, handleSelect]
  );

  const getStatusIcon = (status: Note["status"]) => {
    switch (status) {
      case "published":
        return <Globe size={16} className="text-[var(--workspace-text-secondary)]" />;
      case "archived":
        return <Archive size={16} className="text-[var(--workspace-text-secondary)]" />;
      default:
        return <FileText size={16} className="text-[var(--workspace-text-secondary)]" />;
    }
  };

  // Get snippet from body
  const getSnippet = (body: string, maxLength = 100) => {
    if (!body) return "";
    const cleaned = body.replace(/[#*`\[\]]/g, "").trim();
    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength) + "..."
      : cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 max-w-xl bg-[var(--workspace-sidebar)] border-[var(--workspace-border)] top-[20%] translate-y-0"
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">Search notes</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--workspace-border)]">
          <Search size={18} className="text-[var(--workspace-text-secondary)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-[var(--workspace-text-primary)] placeholder:text-[var(--workspace-text-tertiary)] outline-none text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded hover:bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto workspace-scrollbar">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--workspace-text-secondary)]">
              Searching...
            </div>
          ) : query && results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--workspace-text-secondary)]">
              No results found
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-1 text-xs font-medium text-[var(--workspace-text-tertiary)]">
                Best matches
              </div>
              {results.map((note, index) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleSelect(note)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-2 flex items-start gap-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-[var(--workspace-active)]"
                      : "hover:bg-[var(--workspace-hover)]"
                  }`}
                >
                  <div className="pt-0.5">{getStatusIcon(note.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--workspace-text-primary)] truncate">
                      {note.title || "Untitled"}
                    </div>
                    {note.body && (
                      <div className="text-xs text-[var(--workspace-text-secondary)] truncate mt-0.5">
                        {getSnippet(note.body)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-[var(--workspace-text-secondary)]">
              Type to search your notes
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--workspace-border)] text-xs text-[var(--workspace-text-tertiary)]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)]">↑↓</kbd>
            <span>Select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)]">↵</kbd>
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--workspace-hover)] text-[var(--workspace-text-secondary)]">esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
