import { MetadataRoute } from "next";

const SITE_URL = "https://d0ne1s.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ArticleSummary {
  id: string;
  updated_at: string;
}

interface ArticlesResponse {
  articles: ArticleSummary[];
  meta: { total_pages: number };
}

async function getAllArticles(): Promise<ArticleSummary[]> {
  const articles: ArticleSummary[] = [];
  let page = 1;

  try {
    while (true) {
      const response = await fetch(
        `${API_BASE_URL}/articles?page=${page}&per_page=100`,
        { next: { revalidate: 3600 } },
      );

      if (!response.ok) break;

      const data: ArticlesResponse = await response.json();
      articles.push(...data.articles);

      if (page >= data.meta.total_pages) break;
      page++;
    }
  } catch {
    // Return whatever we've collected so far
  }

  return articles;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...articles.map((article) => ({
      url: `${SITE_URL}/articles/${article.id}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
