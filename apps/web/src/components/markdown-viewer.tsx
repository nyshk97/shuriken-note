"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  /** Use Zenn-inspired styles for public pages */
  variant?: "default" | "public";
}

export function MarkdownViewer({
  content,
  className,
  variant = "default",
}: MarkdownViewerProps) {
  const baseClassName =
    variant === "public"
      ? "znc"
      : "prose prose-slate max-w-none";

  return (
    <article className={`${baseClassName} ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
