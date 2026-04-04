const MARKDOWN_IMAGE_REGEX = /!\[.*?\]\((https?:\/\/[^)]+)\)/;

export function extractFirstImageUrl(markdown: string): string | null {
  const match = markdown.match(MARKDOWN_IMAGE_REGEX);
  return match ? match[1] : null;
}
