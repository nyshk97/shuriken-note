import Link from "next/link";

export interface ArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export function ArticleCard({ article }: { article: ArticleSummary }) {
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
