import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You — DAN",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function TipSuccessPage({ params }: PageProps) {
  const { uuid } = await params;

  return (
    <div
      className="min-h-screen bg-white antialiased"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🙏</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
            Thank you for your tip!
          </h1>
          <p className="text-gray-500 mb-8">
            Your support means a lot and helps keep this content going.
          </p>
          <Link
            href={`/articles/${uuid}`}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            &larr; Back to article
          </Link>
        </div>
      </div>
    </div>
  );
}
