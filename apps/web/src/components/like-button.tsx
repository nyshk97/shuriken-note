"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface LikeButtonProps {
  articleId: string;
  initialCount: number;
}

function isAlreadyLiked(articleId: string): boolean {
  try {
    const liked = JSON.parse(localStorage.getItem("liked_articles") || "[]");
    return liked.includes(articleId);
  } catch {
    return false;
  }
}

function markAsLiked(articleId: string): void {
  try {
    const liked = JSON.parse(localStorage.getItem("liked_articles") || "[]");
    if (!liked.includes(articleId)) {
      liked.push(articleId);
      localStorage.setItem("liked_articles", JSON.stringify(liked));
    }
  } catch {}
}

export function LikeButton({ articleId, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLiked(isAlreadyLiked(articleId));
    fetch(`${API_BASE_URL}/articles/${articleId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setCount(data.article.likes_count))
      .catch(() => {});
  }, [articleId]);

  async function handleLike() {
    if (liked || isSubmitting) return;

    setLiked(true);
    setCount((prev) => prev + 1);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
        method: "POST",
      });
      const data = await res.json();
      setCount(data.likes_count);
      markAsLiked(articleId);
    } catch {
      setLiked(false);
      setCount((prev) => prev - 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={liked}
      className={`group flex items-center gap-1.5 text-sm transition-colors ${
        liked
          ? "text-rose-500 cursor-default"
          : "text-gray-400 cursor-pointer hover:text-rose-500 hover:scale-105 active:scale-95"
      }`}
      aria-label={liked ? "Liked" : "Like this article"}
    >
      <Heart
        className={`size-4 transition-all ${
          liked
            ? "fill-rose-500 text-rose-500"
            : "group-hover:fill-rose-200 group-hover:text-rose-500"
        }`}
      />
      <span className={liked ? "text-rose-500" : ""}>{count}</span>
    </button>
  );
}
