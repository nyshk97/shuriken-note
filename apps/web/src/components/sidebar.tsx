"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  Globe,
  Archive,
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  FilePlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateNote } from "@/hooks/use-create-note";
import { SearchDialog } from "@/components/search-dialog";
import { getNotes, deleteNote, updateNote, type Note } from "@/lib/api";
import { DEFAULT_LANDING_PATH } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper to build tree structure
interface NoteTreeNode {
  note: Note;
  children: Note[];
}

interface SidebarProps {
  isOpen?: boolean;
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd+P (Mac) / Ctrl+P (Windows/Linux) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes({ sort: "-created_at" }),
  });

  // Mutation for updating note status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Note["status"] }) =>
      updateNote(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Configure sensors - require some movement before drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Build tree structure: group notes by effective_status and organize parent-child
  const sections = useMemo(() => {
    const buildTree = (sectionNotes: Note[]): NoteTreeNode[] => {
      const parentNotes = sectionNotes.filter((n) => !n.parent_note_id);
      const childNotes = sectionNotes.filter((n) => n.parent_note_id);

      return parentNotes.map((parent) => ({
        note: parent,
        children: childNotes.filter((child) => child.parent_note_id === parent.id),
      }));
    };

    // Use effective_status for grouping (inherits from parent)
    const personalNotes = notes.filter((n) => n.effective_status === "personal");
    const publishedNotes = notes.filter((n) => n.effective_status === "published");
    const archivedNotes = notes.filter((n) => n.effective_status === "archived");

    return [
      { key: "personal" as const, label: "Private", tree: buildTree(personalNotes) },
      { key: "published" as const, label: "Public", tree: buildTree(publishedNotes) },
      { key: "archived" as const, label: "Archived", tree: buildTree(archivedNotes) },
    ];
  }, [notes]);

  const handleDragStart = (event: DragStartEvent) => {
    const note = notes.find((n) => n.id === event.active.id);
    if (note) {
      setActiveNote(note);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNote(null);

    if (!over) return;

    const noteId = active.id as string;
    const newStatus = over.id as Note["status"];
    const note = notes.find((n) => n.id === noteId);

    // Only update if dropping on a different section
    if (note && note.status !== newStatus) {
      updateStatusMutation.mutate({ id: noteId, status: newStatus });
    }
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col bg-[var(--workspace-sidebar)] border-r border-[var(--workspace-border)] h-full transition-all duration-200 group/sidebar overflow-hidden ${isOpen ? "w-[240px]" : "w-0 border-r-0"
        }`}
    >
      {/* Workspace header */}
      <div className="px-3 py-3 h-[45px] flex items-center m-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-[var(--workspace-accent)] flex items-center justify-center text-xs font-medium text-white">
            {user?.email?.charAt(0).toUpperCase() || "S"}
          </div>
          <span className="truncate text-sm font-medium">Shuriken Note</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-2 flex flex-col gap-0.5 mb-4">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer w-full text-left group"
        >
          <Search size={18} />
          <span className="flex-1">Search</span>
          <kbd className="text-xs text-[var(--workspace-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
            ⌘P
          </kbd>
        </button>
        <div className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer">
          <Settings size={18} />
          <span>Settings</span>
        </div>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Notes sections with DnD */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 workspace-scrollbar">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-[var(--workspace-text-secondary)]">
              Loading...
            </div>
          ) : (
            sections.map((section) => (
              <NoteSectionComponent
                key={section.key}
                sectionKey={section.key}
                label={section.label}
                tree={section.tree}
                currentPath={pathname}
                defaultExpanded={section.key !== "archived"}
                showNewButton={section.key !== "archived"}
              />
            ))
          )}
        </div>

        {/* Drag overlay - shows the dragged item */}
        <DragOverlay>
          {activeNote ? (
            <div className="flex items-center gap-2 px-3 py-1 text-sm rounded bg-[var(--workspace-active)] text-[var(--workspace-text-primary)] shadow-lg opacity-90">
              {activeNote.status === "published" ? (
                <Globe size={18} />
              ) : activeNote.status === "archived" ? (
                <Archive size={18} />
              ) : (
                <FileText size={18} />
              )}
              <span className="truncate">{activeNote.title || "Untitled"}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </aside>
  );
}

function NoteSectionComponent({
  sectionKey,
  label,
  tree,
  currentPath,
  defaultExpanded = true,
  showNewButton = false,
}: {
  sectionKey: Note["status"];
  label: string;
  tree: NoteTreeNode[];
  currentPath: string;
  defaultExpanded?: boolean;
  showNewButton?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const createNoteMutation = useCreateNote();

  // Make section a drop target
  const { isOver, setNodeRef } = useDroppable({
    id: sectionKey,
  });

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  // Map section key to note status for creation
  const getCreateStatus = (): Note["status"] => {
    return sectionKey === "published" ? "published" : "personal";
  };

  return (
    <div ref={setNodeRef}>
      <button
        type="button"
        onClick={toggleExpanded}
        className={`w-full px-3 py-1 text-xs font-semibold text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)] rounded cursor-pointer flex items-center gap-1 transition-colors ${isOver ? "bg-[var(--workspace-accent)]/20" : ""
          }`}
      >
        <ChevronRight
          size={14}
          className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
        <span>{label}</span>
      </button>
      {isExpanded && (
        <div className={`mt-0.5 space-y-0.5 transition-colors ${isOver ? "bg-[var(--workspace-accent)]/10 rounded" : ""}`}>
          {tree.map((node) => (
            <NoteTreeItem
              key={node.note.id}
              node={node}
              currentPath={currentPath}
              sectionKey={sectionKey}
            />
          ))}
          {showNewButton && (
            <button
              type="button"
              onClick={() => createNoteMutation.mutate(getCreateStatus())}
              disabled={createNoteMutation.isPending}
              className="flex items-center gap-2 px-3 py-1 text-sm text-[var(--workspace-text-tertiary)] hover:bg-[var(--workspace-hover)] hover:text-[var(--workspace-text-secondary)] rounded cursor-pointer transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              <span>{createNoteMutation.isPending ? "Creating..." : "New page"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Tree item component for parent notes with children
function NoteTreeItem({
  node,
  currentPath,
  sectionKey,
}: {
  node: NoteTreeNode;
  currentPath: string;
  sectionKey: Note["status"];
}) {
  // Check if any child is currently active
  const hasActiveChild = node.children.some(
    (child) => currentPath === `/notes/${child.id}`
  );

  const hasChildren = node.children.length > 0;

  // User's manual expand/collapse preference (only applies when no active child)
  const [userExpanded, setUserExpanded] = useState(false);

  // Always expand if a child is active, otherwise respect user's preference
  const isExpanded = hasActiveChild || userExpanded;

  const handleToggleExpand = () => {
    setUserExpanded((prev) => !prev);
  };

  return (
    <div>
      <DraggableNoteItem
        note={node.note}
        isActive={currentPath === `/notes/${node.note.id}`}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        canAddChild={sectionKey !== "archived" && !node.note.parent_note_id}
      />
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[var(--workspace-border)]">
          {node.children.map((child) => (
            <DraggableNoteItem
              key={child.id}
              note={child}
              isActive={currentPath === `/notes/${child.id}`}
              isChild
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableNoteItem({
  note,
  isActive,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  canAddChild = false,
  isChild = false,
}: {
  note: Note;
  isActive: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  canAddChild?: boolean;
  isChild?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: note.id,
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
      {...listeners}
      {...attributes}
    >
      <NoteItemContent
        note={note}
        isActive={isActive}
        isDragging={isDragging}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        canAddChild={canAddChild}
        isChild={isChild}
      />
    </div>
  );
}

function NoteItemContent({
  note,
  isActive,
  isDragging = false,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  canAddChild = false,
  isChild = false,
}: {
  note: Note;
  isActive: boolean;
  isDragging?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  canAddChild?: boolean;
  isChild?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createNoteMutation = useCreateNote();
  const [menuOpen, setMenuOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (isActive) {
        router.push(DEFAULT_LANDING_PATH);
      }
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const message = hasChildren
      ? "Are you sure you want to delete this note and all its child notes?"
      : "Are you sure you want to delete this note?";
    if (confirm(message)) {
      deleteMutation.mutate();
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    createNoteMutation.mutate({
      status: note.effective_status === "published" ? "published" : "personal",
      parent_note_id: note.id,
    });
  };

  const getIcon = () => {
    if (note.effective_status === "published") return <Globe size={18} />;
    if (note.effective_status === "archived") return <Archive size={18} />;
    return <FileText size={18} />;
  };

  return (
    <div className="group/item relative flex items-center">
      {/* Expand/collapse toggle for parent notes with children */}
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className="p-0.5 rounded hover:bg-[var(--workspace-hover)] flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronDown size={14} className="text-[var(--workspace-text-tertiary)]" />
          ) : (
            <ChevronRight size={14} className="text-[var(--workspace-text-tertiary)]" />
          )}
        </button>
      ) : (
        <div className="w-[18px] flex-shrink-0" />
      )}

      <Link
        href={`/notes/${note.id}`}
        className={`flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors flex-1 min-w-0 ${isDragging
          ? "cursor-grabbing"
          : "cursor-pointer"
          } ${isActive
            ? "bg-[var(--workspace-active)] text-[var(--workspace-text-primary)]"
            : "text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-hover)]"
          } ${isChild ? "pl-2" : ""}`}
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        {getIcon()}
        <span className="truncate flex-1">{note.title || "Untitled"}</span>
      </Link>

      {/* Context menu trigger */}
      {!isDragging && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--workspace-hover)] transition-opacity ${menuOpen
                ? "opacity-100"
                : "opacity-0 group-hover/item:opacity-100"
                }`}
            >
              <MoreHorizontal size={16} className="text-[var(--workspace-text-secondary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="right"
            className="w-48 bg-[var(--workspace-sidebar)] border-[var(--workspace-border)]"
          >
            {canAddChild && (
              <>
                <DropdownMenuItem
                  onClick={handleAddChild}
                  className="cursor-pointer"
                >
                  <FilePlus size={16} className="mr-2" />
                  Add child note
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
            >
              <Trash2 size={16} className="mr-2 text-red-500" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
