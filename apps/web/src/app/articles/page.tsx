import { Metadata } from "next";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

interface ArticlesResponse {
  articles: ArticleSummary[];
  meta: PaginationMeta;
}

async function getArticles(page = 1): Promise<ArticlesResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/articles?page=${page}&per_page=20`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Articles — Shuriken Note",
  description: "Published articles on Shuriken Note",
  openGraph: {
    title: "Articles — Shuriken Note",
    description: "Published articles on Shuriken Note",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const data = await getArticles(page);

  const articles = data?.articles ?? [];
  const meta = data?.meta ?? { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Articles</h1>
          <p className="mt-2 text-gray-500">
            {meta.total_count} {meta.total_count === 1 ? "article" : "articles"} published
          </p>
        </header>

        {articles.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No articles published yet.
          </p>
        ) : (
          <div className="space-y-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {meta.total_pages > 1 && (
          <Pagination currentPage={meta.current_page} totalPages={meta.total_pages} />
        )}

        <footer className="mt-16 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            Shuriken Note
          </p>
        </footer>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleSummary }) {
  const formattedDate = new Date(article.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article>
      <Link
        href={`/articles/${article.id}`}
        className="block group"
      >
        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {article.title || "Untitled"}
        </h2>
        <time className="text-sm text-gray-400 mt-1 block" dateTime={article.created_at}>
          {formattedDate}
        </time>
        {article.excerpt && (
          <p className="mt-2 text-gray-600 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </Link>
    </article>
  );
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <nav className="mt-12 flex items-center justify-center gap-4">
      {currentPage > 1 && (
        <Link
          href={`/articles?page=${currentPage - 1}`}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400 transition-colors"
        >
          Previous
        </Link>
      )}
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link
          href={`/articles?page=${currentPage + 1}`}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
