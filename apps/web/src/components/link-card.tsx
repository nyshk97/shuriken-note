"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface OgpData {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  site_name: string | null;
  url: string;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Shared per-URL cache holding in-flight requests as well as results,
// so cards for the same URL (including remounts during live preview
// re-renders) trigger at most one fetch. Failed entries are evicted
// so a later mount can retry.
const ogpCache = new Map<string, Promise<OgpData>>();

function fetchOgpCached(url: string): Promise<OgpData> {
  const cached = ogpCache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    const res = await fetch(`${API_BASE_URL}/ogp?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`OGP fetch failed: ${res.status}`);
    const data = await res.json();
    return data.ogp as OgpData;
  })();

  promise.catch(() => {
    ogpCache.delete(url);
  });

  ogpCache.set(url, promise);
  return promise;
}

export function LinkCard({ url }: { url: string }) {
  const [ogp, setOgp] = useState<OgpData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchOgpCached(url)
      .then((data) => {
        if (!cancelled) setOgp(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    );
  }

  if (!ogp) {
    return (
      <div className="link-card link-card--loading">
        <div className="link-card__body">
          <div className="link-card__skeleton link-card__skeleton--title" />
          <div className="link-card__skeleton link-card__skeleton--desc" />
          <div className="link-card__skeleton link-card__skeleton--host" />
        </div>
        <div className="link-card__thumbnail link-card__skeleton" />
      </div>
    );
  }

  const hostname = ogp.site_name || extractHostname(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-card"
    >
      <div className="link-card__body">
        <span className="link-card__title">
          {ogp.title || url}
        </span>
        {ogp.description && (
          <span className="link-card__description">
            {ogp.description}
          </span>
        )}
        <span className="link-card__meta">
          {ogp.favicon && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={ogp.favicon}
              alt=""
              className="link-card__favicon"
              width={14}
              height={14}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          {hostname}
        </span>
      </div>
      {ogp.image && (
        <div className="link-card__thumbnail">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogp.image}
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display =
                "none";
            }}
          />
        </div>
      )}
    </a>
  );
}
