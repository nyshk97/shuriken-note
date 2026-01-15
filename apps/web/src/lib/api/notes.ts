import { apiClient } from "./client";

// Types
export interface Note {
  id: string; // UUID
  title: string;
  body: string;
  slug: string;
  status: "personal" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  title?: string;
  body?: string;
  status?: Note["status"];
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  status?: Note["status"];
}

// API Response types
interface NotesListResponse {
  notes: Note[];
}

interface NoteResponse {
  note: Note;
}

// API functions

/**
 * Get all notes for the current user
 * @param q - Optional search query
 * @param sort - Optional sort field (e.g., "-created_at", "updated_at")
 */
export async function getNotes(options?: {
  q?: string;
  sort?: string;
}): Promise<Note[]> {
  const params = new URLSearchParams();
  if (options?.q) params.set("q", options.q);
  if (options?.sort) params.set("sort", options.sort);

  const query = params.toString();
  const endpoint = `/notes${query ? `?${query}` : ""}`;

  const response = await apiClient<NotesListResponse>(endpoint);
  return response.notes;
}

/**
 * Get a single note by ID (UUID)
 */
export async function getNote(id: string): Promise<Note> {
  const response = await apiClient<NoteResponse>(`/notes/${id}`);
  return response.note;
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput = {}): Promise<Note> {
  const response = await apiClient<NoteResponse>("/notes", {
    method: "POST",
    body: { note: input },
  });
  return response.note;
}

/**
 * Update an existing note
 */
export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<Note> {
  const response = await apiClient<NoteResponse>(`/notes/${id}`, {
    method: "PATCH",
    body: { note: input },
  });
  return response.note;
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  await apiClient<void>(`/notes/${id}`, {
    method: "DELETE",
  });
}
