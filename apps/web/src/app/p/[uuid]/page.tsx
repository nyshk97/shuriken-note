import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarkdownViewer } from "@/components/markdown-viewer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface PublicNote {
  id: string;
  title: string | null;
  body: string | null;
  status: "published";
  created_at: string;
  updated_at: string;
}

async function getPublicNote(uuid: string): Promise<PublicNote | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/p/${uuid}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.note;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const note = await getPublicNote(uuid);

  if (!note) {
    return {
      title: "Note Not Found",
    };
  }

  const title = note.title || "Untitled Note";
  // Extract first 160 characters of body for description
  const description = note.body
    ? note.body.slice(0, 160).replace(/[#*`\n]/g, " ").trim() + (note.body.length > 160 ? "..." : "")
    : "A note on Shuriken Note";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: note.created_at,
      modifiedTime: note.updated_at,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicNotePage({ params }: PageProps) {
  const { uuid } = await params;
  const note = await getPublicNote(uuid);

  if (!note) {
    notFound();
  }

  const formattedDate = new Date(note.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          {note.title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {note.title}
            </h1>
          )}
          <time className="text-sm text-gray-500" dateTime={note.updated_at}>
            Last updated: {formattedDate}
          </time>
        </header>

        {/* Content */}
        <main>
          <MarkdownViewer content={note.body || ""} />
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            Published on Shuriken Note
          </p>
        </footer>
      </div>
    </div>
  );
}
