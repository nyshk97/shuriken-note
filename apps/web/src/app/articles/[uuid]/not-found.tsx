import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Article not found
        </h1>
        <p className="text-gray-500 mb-6">
          This article doesn&apos;t exist or is no longer available.
        </p>
        <Link
          href="/articles"
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          &larr; Back to articles
        </Link>
      </div>
    </div>
  );
}
