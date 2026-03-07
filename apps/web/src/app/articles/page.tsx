import { Metadata } from "next";
import Link from "next/link";
import { ArticleCard, type ArticleSummary } from "@/components/article-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
  title: "Articles — DAN",
  description: "Published articles by DAN",
  robots: { index: false, follow: true },
  openGraph: {
    title: "Articles — DAN",
    description: "Published articles by DAN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Articles — DAN",
    description: "Published articles by DAN",
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
            DAN
          </p>
        </footer>
      </div>
    </div>
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
