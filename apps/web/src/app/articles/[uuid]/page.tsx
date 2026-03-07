import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MarkdownViewer } from "@/components/markdown-viewer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Article {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

async function getArticle(uuid: string): Promise<Article | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${uuid}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.article;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const article = await getArticle(uuid);

  if (!article) {
    return { title: "Article Not Found", robots: { index: false, follow: false } };
  }

  const title = article.title || "Untitled";
  const description = article.body
    ? article.body.slice(0, 160).replace(/[#*`\n]/g, " ").trim() + (article.body.length > 160 ? "..." : "")
    : "An article by DAN";

  return {
    title: `${title} — DAN`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.created_at,
      modifiedTime: article.updated_at,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { uuid } = await params;
  const article = await getArticle(uuid);

  if (!article) {
    notFound();
  }

  const formattedDate = new Date(article.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav className="mb-8">
          <Link
            href="/articles"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            &larr; All articles
          </Link>
        </nav>

        <header className="mb-8">
          {article.title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {article.title}
            </h1>
          )}
          <time className="text-sm text-gray-500" dateTime={article.created_at}>
            {formattedDate}
          </time>
        </header>

        <main>
          <MarkdownViewer content={article.body || ""} variant="public" />
        </main>

        <footer className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Published by DAN
          </p>
          <Link
            href="/articles"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            &larr; All articles
          </Link>
        </footer>
      </div>
    </div>
  );
}
