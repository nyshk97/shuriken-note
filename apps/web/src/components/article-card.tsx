import Link from "next/link";
import { Heart } from "lucide-react";

export interface ArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export function ArticleCard({ article }: { article: ArticleSummary }) {
  const formattedDate = new Date(article.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article>
      <Link href={`/articles/${article.id}`} className="group block">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
            {article.title || "Untitled"}
          </h2>
          <div className="flex items-center gap-3 shrink-0">
            {article.likes_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Heart className="size-3" />
                {article.likes_count}
              </span>
            )}
            <time
              className="text-xs text-gray-400"
              dateTime={article.created_at}
            >
              {formattedDate}
            </time>
          </div>
        </div>
        {article.excerpt && (
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            {article.excerpt}
          </p>
        )}
      </Link>
    </article>
  );
}
