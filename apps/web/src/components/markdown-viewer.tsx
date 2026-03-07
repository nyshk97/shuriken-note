"use client";

import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { LinkCard } from "./link-card";

const URL_REGEX = /^https?:\/\/[^\s]+$/;

function isBareLink(children: React.ReactNode, href: string | undefined): boolean {
  if (!href) return false;
  const text = React.Children.toArray(children)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("");
  return text === href && URL_REGEX.test(href);
}

/**
 * In public variant, paragraphs containing only a bare link
 * (text === href) are rendered as rich link cards.
 */
function createPublicComponents(): Components {
  return {
    p({ children }) {
      const childArray = React.Children.toArray(children);

      if (childArray.length === 1 && React.isValidElement(childArray[0])) {
        const child = childArray[0] as React.ReactElement<{
          href?: string;
          children?: React.ReactNode;
        }>;
        if (
          child.type === "a" &&
          child.props.href &&
          isBareLink(child.props.children, child.props.href)
        ) {
          return <LinkCard url={child.props.href} />;
        }
      }

      return <p>{children}</p>;
    },
  };
}

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

  const components = variant === "public" ? createPublicComponents() : undefined;

  return (
    <article className={`${baseClassName} ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
